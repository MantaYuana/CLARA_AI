/**
 * contract.ts
 * POST /api/v1/contract/review
 *
 * Accepts:
 *   - multipart/form-data: file (PDF or image) + optional text + question
 *   - application/json: { text, question }
 *
 * Pipeline: OCR → segment + embed + store clauses → guardrail → hybrid retrieval → Gemini reasoning
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { processUploadedFile } from "../services/ocr/ocrService";
import { embedText } from "../services/embedding/embeddingService";
import { runGuardrailChecks } from "../services/guardrail/guardrailService";
import { hybridRetrieval } from "../services/retrieval/hybridRetrieval";
import { reason } from "../services/reasoning/reasoningService";
import { getSession } from "../config/neo4j";
import { TaskType } from "@google/generative-ai";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

const TextBodySchema = z.object({
  text: z.string().min(10).optional(),
  question: z
    .string()
    .optional()
    .default("Analisis kontrak ini dan temukan klausula yang berpotensi merugikan."),
});

// Store clauses as ContractClause nodes in Neo4j
async function storeClauses(
  documentId: string,
  clauses: Awaited<ReturnType<typeof processUploadedFile>>["clauses"],
): Promise<void> {
  const session = await getSession();
  try {
    for (const clause of clauses) {
      let embedding: number[] = [];
      try {
        embedding = await embedText(
          clause.content || clause.header,
          TaskType.RETRIEVAL_DOCUMENT,
        );
      } catch {
        // Skip embedding if API fails; clause is still stored without vector
      }

      await session.run(
        `
        MERGE (cc:ContractClause { id: $id })
        SET cc.document_id = $documentId,
            cc.index       = $index,
            cc.header      = $header,
            cc.content     = $content,
            cc.embedding   = $embedding,
            cc.created_at  = datetime()
        `,
        {
          id: `${documentId}-${clause.index}`,
          documentId,
          index: clause.index,
          header: clause.header,
          content: clause.content,
          embedding,
        },
      );
    }
  } finally {
    await session.close();
  }
}

router.post(
  "/review",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      let contractText = "";
      const question =
        (req.body?.question as string) ||
        "Analisis kontrak ini dan temukan klausula yang berpotensi merugikan.";
      const documentId = uuidv4();

      // Extract text
      if (req.file) {
        const ocrResult = await processUploadedFile(req.file.buffer, req.file.mimetype);
        contractText = ocrResult.raw_text;

        // Store clauses in background (non-blocking for response speed)
        storeClauses(documentId, ocrResult.clauses).catch((err) =>
          console.warn("Clause storage warning:", err?.message),
        );

        // Run all pipeline steps
        const [guardrail, context] = await Promise.all([
          runGuardrailChecks(contractText),
          hybridRetrieval(question, documentId),
        ]);
        const reasoning = await reason(question, context);

        res.json({
          document_id: documentId,
          answer: reasoning.answer,
          confidence: reasoning.confidence,
          citations: reasoning.citations,
          clauses: ocrResult.clauses.map((c) => ({
            index: c.index,
            header: c.header,
            content_preview: c.content_preview,
            pasal_references: c.pasal_references,
          })),
          guardrail: {
            is_safe: guardrail.is_safe,
            critical_violations: guardrail.critical_violations,
            warning_count: guardrail.warning_count,
            all_checks: guardrail.checks,
          },
          language: "id",
        });
        return;
      }

      // Text - only path
      const parsed = TextBodySchema.safeParse(req.body);
      if (!parsed.success || (!parsed.data.text && !req.file)) {
        res
          .status(400)
          .json({ error: 'Provide either a file upload or a "text" field.' });
        return;
      }

      contractText = parsed.data.text ?? "";
      const resolvedQuestion = parsed.data.question;

      const [guardrail, context] = await Promise.all([
        runGuardrailChecks(contractText),
        hybridRetrieval(resolvedQuestion),
      ]);
      const reasoning = await reason(resolvedQuestion, context, [
        { role: "user", content: `Kontrak untuk dianalisis:\n${contractText}` },
      ]);

      res.json({
        document_id: documentId,
        answer: reasoning.answer,
        confidence: reasoning.confidence,
        citations: reasoning.citations,
        clauses: [],
        guardrail: {
          is_safe: guardrail.is_safe,
          critical_violations: guardrail.critical_violations,
          warning_count: guardrail.warning_count,
          all_checks: guardrail.checks,
        },
        language: "id",
      });
    } catch (err: unknown) {
      console.error("[contract/review]", err);
      const message = err instanceof Error ? err.message : "Internal server error";
      res.status(500).json({ error: message });
    }
  },
);

export default router;
