import { useState } from "react";
import { sendMessage } from "../Services/chatService";
import { reviewContract } from "../Services/reviewService";
import toast from "react-hot-toast";

const INITIAL_MESSAGE = {
  id: "init",
  role: "assistant",
  content:
    "Welcome! I'm CLARA AI, your Contract Legal Analysis & Review Assistant. Upload a legal contract on the left panel and provide context, then choose a feature from the right panel to get started.",
  timestamp: new Date().toISOString(),
};

/**
 * useChat — manages chat messages and active mode.
 *
 * Routing logic:
 *  - mode === 'review' → calls reviewContract (POST /contract/review)
 *                        requires: selectedFile (File object) + message (question)
 *  - any other mode   → calls sendMessage (POST /query)
 *                        requires: message + optional selectedSourceIds
 *
 * sendChatMessage param:
 *  { message: string, selectedSourceIds: string[], selectedFile: File|null, mode: string|null }
 */
const useChat = () => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [activeMode, setActiveMode] = useState(null);
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
          "Review mode: pilih satu file terlebih dahulu dari panel Sources.",
        );
        return;
      }
      if (!message?.trim()) {
        toast.error("Review mode: tuliskan pertanyaan review terlebih dahulu.");
        return;
      }
    }

    // Optimistically add user message
    addMessage("user", message.trim());
    setIsLoading(true);

    try {
      if (mode === "review") {
        // ── Review Contract mode ───────────────────────────────────────────
        const {
          content,
          confidenceScore,
          citations,
          label,
          clauses,
          rationale,
        } = await reviewContract({
          file: selectedFile,
          question: message.trim(),
        });

        addMessage("assistant", content, {
          confidenceScore: confidenceScore ?? null,
          citations: citations ?? [],
          label: label ?? null,
          clauses: clauses ?? [],
          rationale: rationale ?? null,
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
          ? "Sesi tidak valid. Silakan login kembali."
          : err?.response?.status === 400
            ? "Permintaan tidak valid. Pastikan file dan pertanyaan sudah benar."
            : "Maaf, terjadi kesalahan saat menghubungi server. Silakan coba lagi.";

      addMessage("assistant", errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, activeMode, setActiveMode, isLoading, sendChatMessage };
};

export default useChat;
