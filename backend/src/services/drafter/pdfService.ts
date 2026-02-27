/**
 * pdfService.ts
 * Converts an assembled markdown draft string into a base64-encoded PDF.
 * Uses pdfmake's browser-bundled build (pdfmake/build/pdfmake + vfs_fonts)
 * which is pure JS — no headless browser or native libs required.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
import type { DocumentType } from "./drafterService";

// Load pdfmake browser bundle + bundled Roboto fonts
const pdfMake = require("pdfmake/build/pdfmake") as {
  vfs: Record<string, string>;
  createPdf: (docDef: unknown) => { getBase64: (cb: (b64: string) => void) => void };
};
const pdfFonts = require("pdfmake/build/vfs_fonts") as {
  pdfMake: { vfs: Record<string, string> };
};

// Attach bundled fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const TYPE_LABELS: Record<DocumentType, string> = {
  MoU: "NOTA KESEPAHAMAN (MEMORANDUM OF UNDERSTANDING)",
  LoI: "SURAT PERNYATAAN NIAT (LETTER OF INTENT)",
  PKS: "PERJANJIAN KERJA SAMA",
};

export interface PdfMeta {
  documentType: DocumentType;
  documentNumber: string;
}

type InlineNode = { text: string; bold?: boolean; italics?: boolean };
type PdfContent = Record<string, unknown>;

/**
 * Parse **bold** and *italic* markers into pdfmake inline node arrays.
 */
function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ text: text.slice(lastIndex, match.index) });
    }
    if (match[0].startsWith("**")) {
      nodes.push({ text: match[2], bold: true });
    } else {
      nodes.push({ text: match[3], italics: true });
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) nodes.push({ text: text.slice(lastIndex) });
  return nodes.length > 0 ? nodes : [{ text }];
}

function stripInline(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

/**
 * Convert a markdown draft string into a pdfmake content array.
 * Handles: # h1, ## h2, ---, **bold**, *italic*, plain paragraphs.
 */
function parseDraftToContent(markdown: string): PdfContent[] {
  const content: PdfContent[] = [];

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      content.push({ text: "", margin: [0, 3, 0, 3] });
      continue;
    }

    if (line.startsWith("# ")) {
      content.push({ text: stripInline(line.slice(2)), style: "title" });
      continue;
    }

    if (line.startsWith("## ")) {
      content.push({ text: stripInline(line.slice(3)), style: "sectionHeader" });
      continue;
    }

    if (line === "---") {
      content.push({
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 495,
            y2: 0,
            lineWidth: 0.5,
            lineColor: "#cccccc",
          },
        ],
        margin: [0, 8, 0, 8],
      });
      continue;
    }

    content.push({ text: parseInline(line), style: "body" });
  }

  return content;
}

/**
 * Generate a PDF from a markdown draft string and return it as base64.
 * @returns Base64 string (no `data:` prefix)
 */
export async function generateDraftPdf(draft: string, meta: PdfMeta): Promise<string> {
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [60, 70, 60, 70],
    info: {
      title: TYPE_LABELS[meta.documentType],
      subject: meta.documentNumber,
      creator: "CLARA AI",
    },
    styles: {
      title: { fontSize: 14, bold: true, alignment: "center", margin: [0, 0, 0, 6] },
      sectionHeader: {
        fontSize: 11,
        bold: true,
        margin: [0, 14, 0, 4],
        color: "#1a1a2e",
      },
      body: { fontSize: 10.5, lineHeight: 1.5, margin: [0, 0, 0, 2], color: "#2d2d2d" },
    },
    defaultStyle: { font: "Roboto", fontSize: 10.5, lineHeight: 1.4 },
    content: parseDraftToContent(draft),
  };

  return new Promise<string>((resolve, reject) => {
    try {
      pdfMake.createPdf(docDefinition).getBase64((base64) => resolve(base64));
    } catch (err) {
      reject(err);
    }
  });
}
