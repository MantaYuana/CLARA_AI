/**
 * drafter.ts
 * POST /api/v1/drafter/chat
 *
 * Multi-turn document drafting (MoU / LoI / PKS).
 * Client must send full conversation history on every turn.
 *
 * @swagger
 * tags:
 *   name: Drafter
 *   description: Agentic multi-turn document drafter
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { runDrafterTurn } from "../services/drafter/drafterService";
import { success, error } from "../utils/response";

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

/**
 * @swagger
 * /api/v1/drafter/chat:
 *   post:
 *     summary: Send a message to the agentic document drafter
 *     tags: [Drafter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id, message]
 *             properties:
 *               session_id:
 *                 type: string
 *               message:
 *                 type: string
 *               history:
 *                 type: array
 *     responses:
 *       200:
 *         description: Drafter response (clarification or draft)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/chat", async (req: Request, res: Response): Promise<void> => {
  const parsed = DrafterChatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(error("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten().fieldErrors));
    return;
  }

  const userId = req.user?.userId ?? "anonymous";

  try {
    const response = await runDrafterTurn({ ...parsed.data, userId });
    res.json(success(response));
  } catch (err: unknown) {
    console.error("[drafter/chat]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json(error("INTERNAL", message));
  }
});

export default router;
