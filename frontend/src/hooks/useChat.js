import { useState } from "react";
import { sendMessage } from "../Services/chatService";

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
 * Returns:
 *  messages        : chat message array
 *  activeMode      : 'review' | 'draft' | null
 *  setActiveMode   : setter
 *  isLoading       : boolean
 *  sendChatMessage : async ({ message, selectedSourceIds, mode }) => void
 */
const useChat = () => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [activeMode, setActiveMode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendChatMessage = async ({ message, selectedSourceIds = [], mode }) => {
    // Add user message immediately (optimistic)
    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { content } = await sendMessage({
        message,
        fileIds: selectedSourceIds, // first id used as document_id in chatService
        mode,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error(
        "[useChat] Query error:",
        err?.response?.data ?? err.message,
      );
      const errMsg =
        err?.response?.status === 401
          ? "Sesi tidak valid. Silakan login kembali."
          : err?.response?.status === 400
            ? "Permintaan tidak valid. Coba lagi."
            : "Maaf, terjadi kesalahan saat menghubungi server. Silakan coba lagi.";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: errMsg,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, activeMode, setActiveMode, isLoading, sendChatMessage };
};

export default useChat;
