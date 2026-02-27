/**
 * drafter.ts
 * POST /api/v1/drafter/chat
 *
 * Multi-turn document drafting (MoU / LoI / PKS).
 * Client must send full conversation history on every turn.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { runDrafterTurn } from "../services/drafter/drafterService";

const router = Router();

const ConversationTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const DrafterChatSchema = z.object({
  session_id: z.string().min(1, "session_id is required"),
  message: z.string().min(1, "message is required"),
  history: z.array(ConversationTurnSchema).default([]),
});

router.post("/chat", async (req: Request, res: Response): Promise<void> => {
  const parsed = DrafterChatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const response = await runDrafterTurn(parsed.data);
    res.json(response);
  } catch (err: unknown) {
    console.error("[drafter/chat]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({
      status: "error",
      error: message,
    });
  }
});

export default router;
