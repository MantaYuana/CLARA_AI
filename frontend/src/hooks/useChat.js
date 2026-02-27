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
    // Add user message immediately
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
        fileIds: selectedSourceIds,
        mode,
      });
      const aiMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
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
