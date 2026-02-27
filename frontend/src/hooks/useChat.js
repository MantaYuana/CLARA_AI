import { useState } from "react";
import { sendMessage } from "../Services/chatService";
import { reviewContract } from "../Services/reviewService";
import { drafterChat } from "../Services/drafterService";
import toast from "react-hot-toast";

const INITIAL_MESSAGE = {
  id: "init",
  role: "assistant",
  content:
    "Welcome! I'm CLARA AI, your Contract Legal Analysis & Review Assistant. Upload a legal contract on the left panel and provide context, then choose a feature from the right panel to get started.",
  timestamp: new Date().toISOString(),
};

/**
 * Generate a unique session ID for draft mode
 */
const generateSessionId = () => {
  return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * useChat — manages chat messages and active mode.
 *
 * Routing logic:
 *  - mode === 'review' → calls reviewContract (POST /contract/review)
 *                        requires: selectedFile (File object) + message (question)
 *  - mode === 'draft'   → calls drafterChat (POST /api/v1/drafter/chat)
 *                        requires: session_id + message + history[]
 *  - any other mode   → calls sendMessage (POST /query)
 *                        requires: message + optional selectedSourceIds
 *
 * sendChatMessage param:
 *  { message: string, selectedSourceIds: string[], selectedFile: File|null, mode: string|null }
 */
const useChat = () => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [activeMode, setActiveModeState] = useState(null);
  const [draftSessionId, setDraftSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (role, content, extras = {}) =>
    setMessages((prev) => [
      ...prev,
      {
        id: `${role[0]}-${Date.now()}`,
        role,
        content,
        timestamp: new Date().toISOString(),
        ...extras,
      },
    ]);

  /**
   * Wrapper for setActiveMode that generates session_id for draft mode
   */
  const setActiveMode = (mode) => {
    setActiveModeState(mode);
    if (mode === "draft") {
      const newSessionId = generateSessionId();
      setDraftSessionId(newSessionId);
      console.log(
        "[useChat] Draft mode activated with session_id:",
        newSessionId,
      );
    } else {
      setDraftSessionId(null);
    }
  };

  /**
   * Build conversation history from messages for drafter API
   */
  const buildDraftHistory = () => {
    return messages
      .filter((msg) => msg.id !== "init") // exclude init message
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
  };

  const sendChatMessage = async ({
    message,
    selectedSourceIds = [],
    selectedFile = null,
    mode,
  }) => {
    // ── Validation: Review mode requires exactly one file ──────────────────
    if (mode === "review") {
      if (!selectedFile) {
        toast.error(
          "Review mode: please select one file from the Sources panel first.",
        );
        return;
      }
      if (!message?.trim()) {
        toast.error("Review mode: please type your review question first.");
        return;
      }
    }

    // ── Validation: Draft mode requires message ────────────────────────────
    if (mode === "draft") {
      if (!message?.trim()) {
        toast.error(
          "Draft mode: please describe the contract you want to create.",
        );
        return;
      }
      if (!draftSessionId) {
        toast.error("Draft mode: session ID not found. Please try again.");
        return;
      }
    }

    // Optimistically add user message
    addMessage("user", message.trim(), {
      attachment:
        mode === "review" && selectedFile
          ? { name: selectedFile.name, size: selectedFile.size }
          : null,
    });
    setIsLoading(true);

    try {
      if (mode === "review") {
        // ── Review Contract mode ───────────────────────────────────────────
        const { content, confidenceScore, citations, label, rationale } =
          await reviewContract({
            file: selectedFile,
            question: message.trim(),
          });

        addMessage("assistant", content, {
          confidenceScore: confidenceScore ?? null,
          citations: citations ?? [],
          label: label ?? null,
          rationale: rationale ?? null,
        });
      } else if (mode === "draft") {
        // ── Draft Contract mode ────────────────────────────────────────────
        const history = buildDraftHistory();
        const {
          content,
          status,
          documentType,
          documentNumber,
          bindingWarning,
          clarifyingQuestions,
          draft,
          pdfBase64,
        } = await drafterChat({
          session_id: draftSessionId,
          message: message.trim(),
          history,
        });

        addMessage("assistant", content, {
          status: status ?? null,
          documentType: documentType ?? null,
          documentNumber: documentNumber ?? null,
          bindingWarning: bindingWarning ?? false,
          clarifyingQuestions: clarifyingQuestions ?? [],
          draft: draft ?? null,
          pdfBase64: pdfBase64 ?? null,
        });
      } else {
        // ── Query mode (default) ───────────────────────────────────────────
        const { content, confidenceScore, citations } = await sendMessage({
          message,
          fileIds: selectedSourceIds,
          mode,
        });

        addMessage("assistant", content, {
          confidenceScore: confidenceScore ?? null,
          citations: citations ?? [],
        });
      }
    } catch (err) {
      console.error("[useChat] Error:", err?.response?.data ?? err.message);
      const errMsg =
        err?.response?.status === 401
          ? "Session expired. Please log in again."
          : err?.response?.status === 400
            ? "Invalid request. Please ensure the file and question are correct."
            : "Something went wrong while contacting the server. Please try again.";

      addMessage("assistant", errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const queryOnly = async ({
    message,
    selectedSourceIds = [],
    mode = null,
  }) => {
    try {
      const { content } = await sendMessage({
        message,
        fileIds: selectedSourceIds,
        mode,
      });

      return { content };
    } catch (err) {
      console.error("[queryOnly] Error:", err);
      return null;
    }
  };

  return {
    messages,
    activeMode,
    setActiveMode,
    isLoading,
    sendChatMessage,
    queryOnly,
  };
};

export default useChat;
