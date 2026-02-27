/**
 * query.ts
 * POST /api/v1/query
 *
 * General-purpose legal Q&A endpoint.
 * When document_id is provided, also searches uploaded contract clauses.
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

/**
 * @swagger
 * /api/v1/query:
 *   post:
 *     summary: Legal Q&A with hybrid retrieval
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
 *               document_id:
 *                 type: string
 *                 format: uuid
 *               history:
 *                 type: array
 *     responses:
 *       200:
 *         description: Answer with citations
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
    const context = await hybridRetrieval(question, document_id);
    const reasoning = await reason(
      question,
      context,
      history.map((h) => ({ role: h.role, content: h.content })),
    );

    res.json(
      success({
        answer: reasoning.answer,
        confidence: reasoning.confidence,
        citations: reasoning.citations,
        document_id: document_id ?? null,
        context_count: context.length,
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
