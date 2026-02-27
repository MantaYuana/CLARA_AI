import { axiosInstance } from "../lib/axios";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Format drafter response into structured data with formatted content
 * Handles both clarification and draft responses
 */
const parseAndFormatDrafterResponse = (data) => {
  // Try to parse if string (in case response is JSON string)
  let parsed = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      // If parse fails, treat as plain text
      return {
        content: data,
        status: null,
        documentType: null,
        bindingWarning: false,
      };
    }
  }

  // Extract fields
  const status = parsed?.status || null;
  const documentType = parsed?.document_type || null;
  const bindingWarning = parsed?.binding_warning || false;
  const clarifyingQuestions = parsed?.clarifying_questions || [];
  const draft = parsed?.draft || null;

  // Build formatted content
  let formattedContent = "";

  // Add status indicator
  if (status === "needs_clarification") {
    formattedContent +=
      "🤔 **Kami memerlukan beberapa klarifikasi sebelum membuat draft.**\n\n";
  } else if (status === "draft_ready") {
    formattedContent += "✅ **Draft Kontrak Siap**\n\n";
  }

  // Add document type info
  if (documentType) {
    formattedContent += `**Jenis Kontrak:** ${documentType}\n`;
    if (bindingWarning) {
      formattedContent +=
        "⚠️ **Perhatian:** Kontrak ini memiliki klausul mengikat yang perlu review lebih lanjut.\n";
    }
    formattedContent += "\n";
  }

  // Add clarifying questions if any
  if (clarifyingQuestions.length > 0) {
    formattedContent += "**Pertanyaan Klarifikasi:**\n";
    clarifyingQuestions.forEach((question, idx) => {
      formattedContent += `${idx + 1}. ${question}\n`;
    });
    formattedContent += "\n";
  }

  // Add draft content if available
  if (draft) {
    formattedContent += "---\n\n";
    formattedContent += draft;
  }

  // If no structured content, show raw message
  if (!formattedContent.trim() && parsed?.message) {
    formattedContent = parsed.message;
  }

  // Fallback to content field if exists
  if (!formattedContent.trim() && parsed?.content) {
    formattedContent = parsed.content;
  }

  return {
    content: formattedContent,
    status,
    documentType,
    bindingWarning,
    clarifyingQuestions,
    draft,
  };
};

/**
 * drafterChat — POST /api/v1/drafter/chat
 *
 * Sends a message to the agentic document drafter for multi-turn contract drafting.
 *
 * @param {Object} params
 *   @param {string} session_id - unique session identifier for the draft
 *   @param {string} message - user message / clarification / draft request
 *   @param {Array} history - conversation history (array of { role, content })
 *
 * Returns: { content, status, documentType, bindingWarning, clarifyingQuestions, draft }
 */
export const drafterChat = async ({ session_id, message, history = [] }) => {
  console.log("[drafterService] POST /api/v1/drafter/chat →", {
    session_id,
    message,
    historyLength: history.length,
  });

  const response = await axiosInstance.post(
    "drafter/chat",
    {
      session_id,
      message,
      history,
    },
    { headers: { "Content-Type": "application/json", ...getAuthHeader() } },
  );

  console.log("[drafterService] Raw response:", response);

  const data = response.data.data;

  const {
    content,
    status,
    documentType,
    bindingWarning,
    clarifyingQuestions,
    draft,
  } = parseAndFormatDrafterResponse(data);

  console.log("[drafterService] Parsed →", {
    content,
    status,
    documentType,
  });

  return {
    content,
    status,
    documentType,
    bindingWarning,
    clarifyingQuestions,
    draft,
  };
};
