import { Router, Request, Response } from "express";
import { z } from "zod";
import { hybridRetrieval } from "../services/retrieval/hybridRetrieval";
import { reason } from "../services/reasoning/reasoningService";
import { getSession } from "../config/neo4j";
import { v4 as uuidv4 } from "uuid";
import { success, error } from "../utils/response";

// --- Pindahkan import ke paling atas ---
import {
  getSessionHistory,
  saveChatMessage,
} from "../services/chat/chatService";

const router = Router();

const QuerySchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters"),
  document_id: z.string().uuid().optional(),
  session_id: z.string().optional(),
  history: z
    .array(
      z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
    )
    .optional()
    .default([]),
});

// --- FUNGSI INI DIKEMBALIKAN (JANGAN DIHAPUS) ---
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
// ------------------------------------------------

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = QuerySchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json(
        error(
          "VALIDATION_ERROR",
          "Invalid request body",
          parsed.error.flatten().fieldErrors,
        ),
      );
    return;
  }

  const {
    question,
    document_id,
    history,
    session_id: req_session_id,
  } = parsed.data;
  const userId =
    (req as Request & { user?: { userId: string } }).user?.userId ??
    "anonymous";
  const session_id = req_session_id ?? uuidv4();

  try {
    // Penanganan Tipe TypeScript yang aman:
    // Mengakomodasi jika kembaliannya berupa Array langsung atau Object yang memiliki property 'history'
    const historyData = await getSessionHistory(session_id);
    const storedHistory: any[] = Array.isArray(historyData)
      ? historyData
      : ((historyData as any).history ?? []);

    // 1. Save user's question immediately
    await saveChatMessage(
      session_id,
      userId,
      "query",
      "user",
      question,
      document_id,
    );

    // 2. Hybrid retrieval (vector + BM25 + symbolic + contract clauses)
    const context = await hybridRetrieval(question, document_id);

    let contextSource: "retrieval" | "raw_text" | "none" = "retrieval";

    // Combine frontend history with stored history and format for Gemini reasoning
    const baseHistory = storedHistory.length > 0 ? storedHistory : history;
    let extraHistory = baseHistory.map((h: any) => ({
      role:
        h.role === "assistant" || h.role === "model"
          ? ("model" as const)
          : ("user" as const),
      content: h.content,
    }));

    // 3. If document_id is provided but context is empty → inject raw_text directly
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

    // 4. Save assistant response
    await saveChatMessage(
      session_id,
      userId,
      "query",
      "assistant",
      reasoning.answer,
      document_id,
    );

    res.json(
      success({
        session_id,
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
    const message =
      err instanceof Error ? err.message : "Internal server error";
    res.status(500).json(error("INTERNAL", message));
  }
});

export default router;
