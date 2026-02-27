/**
 * query.ts
 * POST /api/v1/query
 *
 * General-purpose legal Q&A endpoint.
 * When document_id is provided:
 *   1. Tries hybrid retrieval (vector + BM25 + symbolic + contract clauses)
 *   2. If context is empty, falls back to fetching raw_text directly from the
 *      Document node in Neo4j and injecting it as conversation context
 *
 * @swagger
 * tags:
 *   name: Query
 *   description: Legal Q&A with optional document context
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { hybridRetrieval } from "../services/retrieval/hybridRetrieval";
import { reason } from "../services/reasoning/reasoningService";
import { getSession } from "../config/neo4j";
import { success, error } from "../utils/response";

const router = Router();

const QuerySchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters"),
  document_id: z.string().uuid().optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional()
    .default([]),
});

//   Fallback: fetch raw_text from Document node                ─

async function fetchDocumentText(documentId: string): Promise<string | null> {
  const session = await getSession();
  try {
    const result = await session.run(
      `MATCH (d:Document { id: $documentId })
       RETURN d.raw_text AS raw_text, d.filename AS filename
       LIMIT 1`,
      { documentId },
    );
    if (result.records.length === 0) return null;
    const rawText = result.records[0].get("raw_text") as string | null;
    return rawText ?? null;
  } catch {
    return null;
  } finally {
    await session.close();
  }
}

//   POST /api/v1/query      ─

/**
 * @swagger
 * /api/v1/query:
 *   post:
 *     summary: Legal Q&A with hybrid retrieval and optional document context
 *     description: |
 *       Ask a legal question with optional uploaded document context.
 *       When `document_id` is provided, the system first tries hybrid retrieval
 *       over stored clauses. If no clauses are found, it falls back to injecting
 *       the document's `raw_text` directly into the reasoning context.
 *     tags: [Query]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *                 minLength: 3
 *                 example: "Siapa pihak pertama dan pihak kedua dalam MoU ini?"
 *               document_id:
 *                 type: string
 *                 format: uuid
 *                 description: "UUID returned from POST /api/v1/document/analyze"
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Answer with citations and confidence score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                 confidence:
 *                   type: number
 *                 citations:
 *                   type: array
 *                 document_id:
 *                   type: string
 *                 context_count:
 *                   type: integer
 *                 context_source:
 *                   type: string
 *                   enum: [retrieval, raw_text, none]
 *                   description: "How the document context was injected"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = QuerySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(error("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten().fieldErrors));
    return;
  }

  const { question, document_id, history } = parsed.data;

  try {
    // 1. Hybrid retrieval (vector + BM25 + symbolic + contract clauses)
    const context = await hybridRetrieval(question, document_id);

    let contextSource: "retrieval" | "raw_text" | "none" = "retrieval";
    let extraHistory = history.map((h) => ({ role: h.role, content: h.content }));

    // 2. If document_id is provided but context is empty → inject raw_text directly
    if (document_id && context.length === 0) {
      const rawText = await fetchDocumentText(document_id);
      if (rawText) {
        // Prepend document content as a system-level message in the history
        extraHistory = [
          {
            role: "user",
            content: `Here is the content of the uploaded document (document_id: ${document_id}):\n\n${rawText}\n\n---\nUse the document content above as context to answer the following question.`,
          },
          ...extraHistory,
        ];
        contextSource = "raw_text";
      } else {
        contextSource = "none";
      }
    }

    const reasoning = await reason(question, context, extraHistory);

    res.json(
      success({
        answer: reasoning.answer,
        confidence: reasoning.confidence,
        citations: reasoning.citations,
        document_id: document_id ?? null,
        context_count: context.length,
        context_source: contextSource,
        language: "id",
      }),
    );
  } catch (err: unknown) {
    console.error("[query]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json(error("INTERNAL", message));
  }
});

export default router;
