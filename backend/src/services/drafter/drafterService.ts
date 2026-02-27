/**
 * drafterService.ts
 * Multi-turn conversational pipeline for MoU / LoI / PKS document drafting.
 *
 * Per turn:
 *  1. Classify document intent (MoU | LoI | PKS)
 *  2. Check for binding MoU warnings (price/penalty terms)
 *  3. Extract structured fields from conversation
 *  4. If fields incomplete → return clarifying questions
 *  5. Fetch ClauseTemplate nodes from Neo4j
 *  6. Assemble and return the final markdown document
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { getSession } from "../../config/neo4j";

const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);

// Types

export type DocumentType = "LoI" | "MoU" | "PKS";
export type DrafterStatus = "needs_clarification" | "draft_ready" | "error";

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface DrafterRequest {
  session_id: string;
  message: string;
  history: ConversationTurn[];
}

export interface DrafterResponse {
  status: DrafterStatus;
  document_type?: DocumentType;
  binding_warning?: boolean;
  clarifying_questions?: string[];
  draft?: string;
  document_number?: string;
}

interface ExtractedFields {
  party_a_name?: string;
  party_b_name?: string;
  scope?: string;
  duration?: string;
  value?: string;
  penalty?: string;
  jurisdiction?: string;
  [key: string]: string | undefined;
}

// Utility

function generateDocumentNumber(type: DocumentType): string {
  const now = new Date();
  const romanMonths = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  const month = romanMonths[now.getMonth()];
  const year = now.getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `${type}/${seq}/${month}/${year}`;
}

function hasBindingTerms(text: string): boolean {
  return /(?:harga|nilai|pembayaran|biaya)\s+Rp|denda\s+\d|penalti\s+\d|penalty.*\d+%/i.test(
    text,
  );
}

// Step 1: Classify intent

async function classifyIntent(
  message: string,
  history: ConversationTurn[],
): Promise<DocumentType> {
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
  const historyText = history
    .slice(-4)
    .map((h) => `${h.role === "user" ? "Pengguna" : "CLARA"}: ${h.content}`)
    .join("\n");

  const prompt = `Berdasarkan percakapan berikut, tentukan jenis dokumen yang ingin dibuat pengguna.
Pilihan: MoU (Memorandum of Understanding / Nota Kesepahaman), LoI (Letter of Intent / Surat Pernyataan Niat), PKS (Perjanjian Kerja Sama / Kontrak Kerja Sama)

Percakapan terbaru:
${historyText}
Pesan terbaru: ${message}

Jawab HANYA dengan satu kata: MoU, LoI, atau PKS. Jika tidak jelas, pilih MoU.`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim().toUpperCase();
  if (raw.includes("LOI")) return "LoI";
  if (raw.includes("PKS")) return "PKS";
  return "MoU";
}

// Step 2: Extract structured fields 

async function extractFields(
  message: string,
  history: ConversationTurn[],
  documentType: DocumentType,
): Promise<ExtractedFields> {
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
  const historyText = history
    .map((h) => `${h.role === "user" ? "Pengguna" : "CLARA"}: ${h.content}`)
    .join("\n");

  const prompt = `Ekstrak informasi berikut dari percakapan ini untuk membuat ${documentType}.
Kembalikan HANYA objek JSON tanpa penjelasan tambahan.

Field yang dibutuhkan:
- party_a_name: nama pihak pertama (perusahaan/individu)
- party_b_name: nama pihak kedua
- scope: ruang lingkup / tujuan kerja sama
- duration: jangka waktu (contoh: "1 tahun", "12 bulan")
- value: nilai/harga kesepakatan (jika ada)
- penalty: ketentuan denda (jika ada)
- jurisdiction: kota untuk pengadilan penyelesaian sengketa

Percakapan:
${historyText}
Pesan terbaru: ${message}

Kembalikan JSON. Gunakan null untuk field yang belum diketahui.`;

  const result = await model.generateContent(prompt);
  const raw = result.response
    .text()
    .trim()
    .replace(/```json|```/g, "")
    .trim();
  try {
    const parsed = JSON.parse(raw) as Record<string, string | null>;
    const fields: ExtractedFields = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v && v !== "null") fields[k] = v;
    }
    return fields;
  } catch {
    return {};
  }
}

// Step 3: Determine clarifying questions 

function buildClarifyingQuestions(
  fields: ExtractedFields,
  documentType: DocumentType,
): string[] {
  const questions: string[] = [];
  if (!fields.party_a_name)
    questions.push("Apa nama lengkap/perusahaan Pihak Pertama (Anda)?");
  if (!fields.party_b_name)
    questions.push("Apa nama lengkap/perusahaan Pihak Kedua (mitra Anda)?");
  if (!fields.scope)
    questions.push("Apa ruang lingkup atau tujuan utama kerja sama ini?");
  if (!fields.duration)
    questions.push(
      "Berapa lama jangka waktu perjanjian ini? (contoh: 1 tahun, 24 bulan)",
    );
  if (documentType === "PKS" && !fields.value) {
    questions.push("Berapa nilai/harga kesepakatan dalam perjanjian ini?");
  }
  return questions;
}

// Step 4: Fetch clause templates from Neo4j

interface ClauseTemplate {
  id: string;
  title: string;
  order: number;
  template: string;
}

async function fetchClauseTemplates(
  documentType: DocumentType,
): Promise<ClauseTemplate[]> {
  const session = await getSession();
  try {
    const result = await session.run(
      `
      MATCH (t:ClauseTemplate)
      WHERE t.document_type = $docType
      RETURN t.id AS id, t.title AS title, t.order AS order, t.template AS template
      ORDER BY t.order ASC
      `,
      { docType: documentType },
    );
    return result.records.map((rec) => ({
      id: rec.get("id") as string,
      title: rec.get("title") as string,
      order: (rec.get("order") as number) ?? 0,
      template: rec.get("template") as string,
    }));
  } finally {
    await session.close();
  }
}

// Default clause templates if Neo4j is empty
const DEFAULT_TEMPLATES: Record<DocumentType, ClauseTemplate[]> = {
  MoU: [
    {
      id: "default-1",
      title: "PARA PIHAK",
      order: 1,
      template:
        "Perjanjian ini dibuat antara **{{party_a_name}}** dan **{{party_b_name}}**.",
    },
    {
      id: "default-2",
      title: "RUANG LINGKUP",
      order: 2,
      template: "Ruang lingkup kerja sama: {{scope}}",
    },
    {
      id: "default-3",
      title: "JANGKA WAKTU",
      order: 3,
      template: "Perjanjian ini berlaku selama {{duration}} sejak penandatanganan.",
    },
    {
      id: "default-4",
      title: "KERAHASIAAN",
      order: 4,
      template:
        "Para Pihak wajib menjaga kerahasiaan informasi yang diperoleh selama kerja sama.",
    },
    {
      id: "default-5",
      title: "PENYELESAIAN SENGKETA",
      order: 5,
      template:
        "Sengketa diselesaikan melalui musyawarah, dan jika gagal, melalui Pengadilan Negeri {{jurisdiction}}.",
    },
  ],
  LoI: [
    {
      id: "default-1",
      title: "PERNYATAAN NIAT",
      order: 1,
      template:
        "**{{party_a_name}}** menyatakan niat untuk bekerja sama dengan **{{party_b_name}}** dalam bidang {{scope}}.",
    },
    {
      id: "default-2",
      title: "JANGKA WAKTU NEGOSIASI",
      order: 2,
      template: "Negosiasi lebih lanjut akan dilakukan dalam waktu {{duration}}.",
    },
  ],
  PKS: [
    {
      id: "default-1",
      title: "PARA PIHAK",
      order: 1,
      template:
        "PKS ini dibuat antara **{{party_a_name}}** (Pihak Pertama) dan **{{party_b_name}}** (Pihak Kedua).",
    },
    {
      id: "default-2",
      title: "RUANG LINGKUP",
      order: 2,
      template: "Ruang lingkup kerja sama: {{scope}}",
    },
    {
      id: "default-3",
      title: "JANGKA WAKTU",
      order: 3,
      template: "PKS ini berlaku selama {{duration}}.",
    },
    {
      id: "default-4",
      title: "PEMBAYARAN",
      order: 4,
      template: "Nilai kerja sama: {{value}}. Ketentuan denda: {{penalty}}.",
    },
    {
      id: "default-5",
      title: "PENYELESAIAN SENGKETA",
      order: 5,
      template: "Sengketa diselesaikan melalui Pengadilan Negeri {{jurisdiction}}.",
    },
  ],
};

// Step 5: Assemble document

function fillTemplate(template: string, fields: ExtractedFields): string {
  let filled = template;
  for (const [key, value] of Object.entries(fields)) {
    filled = filled.replace(
      new RegExp(`{{${key}}}`, "g"),
      value ?? `[${key.toUpperCase()}]`,
    );
  }
  // Replace any remaining unfilled placeholders
  filled = filled.replace(/{{[^}]+}}/g, "[BELUM DIISI]");
  return filled;
}

function assembleDraft(
  documentType: DocumentType,
  fields: ExtractedFields,
  templates: ClauseTemplate[],
  documentNumber: string,
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const typeLabels: Record<DocumentType, string> = {
    MoU: "NOTA KESEPAHAMAN (MEMORANDUM OF UNDERSTANDING)",
    LoI: "SURAT PERNYATAAN NIAT (LETTER OF INTENT)",
    PKS: "PERJANJIAN KERJA SAMA",
  };

  let doc = `# ${typeLabels[documentType]}\n`;
  doc += `**Nomor: ${documentNumber}**\n\n`;
  doc += `*Dibuat di Jakarta, pada tanggal ${dateStr}*\n\n---\n\n`;

  for (const tmpl of templates) {
    doc += `## ${tmpl.title}\n\n`;
    doc += fillTemplate(tmpl.template, fields);
    doc += "\n\n";
  }

  doc += `---\n\n*Demikian ${typeLabels[documentType]} ini dibuat dalam keadaan sadar dan tanpa paksaan dari pihak manapun.*\n\n`;
  doc += `**PIHAK PERTAMA**\n\n\n\n___________________\n${fields.party_a_name ?? "[Nama Pihak Pertama]"}\n\n`;
  doc += `**PIHAK KEDUA**\n\n\n\n___________________\n${fields.party_b_name ?? "[Nama Pihak Kedua]"}\n`;

  return doc;
}

// Main export

export async function runDrafterTurn(req: DrafterRequest): Promise<DrafterResponse> {
  const fullHistory = [...req.history, { role: "user" as const, content: req.message }];

  // 1. Classify intent
  const documentType = await classifyIntent(req.message, req.history);

  // 2. Binding warning
  const allUserText = fullHistory
    .filter((h) => h.role === "user")
    .map((h) => h.content)
    .join(" ");
  const binding_warning = documentType === "MoU" && hasBindingTerms(allUserText);

  // 3. Extract fields
  const fields = await extractFields(req.message, req.history, documentType);

  // 4. Clarifying questions
  const clarifying_questions = buildClarifyingQuestions(fields, documentType);
  if (clarifying_questions.length > 0 && req.history.length < 6) {
    // Allow up to 3 clarification rounds (6 turns) before forcing draft
    return {
      status: "needs_clarification",
      document_type: documentType,
      binding_warning,
      clarifying_questions,
    };
  }

  // 5. Fetch clause templates
  let templates: ClauseTemplate[] = [];
  try {
    templates = await fetchClauseTemplates(documentType);
  } catch {
    // Neo4j unavailable — use defaults
  }
  if (templates.length === 0) {
    templates = DEFAULT_TEMPLATES[documentType];
  }

  // 6. Assemble draft
  const documentNumber = generateDocumentNumber(documentType);
  const draft = assembleDraft(documentType, fields, templates, documentNumber);

  return {
    status: "draft_ready",
    document_type: documentType,
    binding_warning,
    draft,
    document_number: documentNumber,
  };
}
