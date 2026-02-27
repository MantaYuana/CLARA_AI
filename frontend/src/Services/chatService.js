import { axiosInstance } from "../lib/axios";

/**
 * DUMMY_DOCUMENT_ID — placeholder until the analyze endpoint returns a real document_id.
 * When the analyze API is ready, pass the actual document_id received from the upload response
 * through selectedSourceIds in useChat, and replace this constant.
 */
const DUMMY_DOCUMENT_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

/**
 * sendQueryMessage — calls POST /api/v1/query
 *
 * Request body:
 *  {
 *    question    : string   — the user's question
 *    document_id : string   — UUID of the analyzed document
 *  }
 *
 * Response (200): Answer with citations  — we read `response.data`
 * Response (400): Validation error
 * Response (401): Unauthorized
 *
 * @param {{ question: string, documentId?: string }} payload
 * @returns {Promise<{ content: string }>}
 */
export const sendMessage = async ({ message, fileIds = [], mode }) => {
  // Use the first selected document_id if available, otherwise fall back to dummy
  // TODO: when analyze endpoint is ready, fileIds will contain real document UUIDs
  const document_id = fileIds.length > 0 ? fileIds[0] : DUMMY_DOCUMENT_ID;

  console.log("[chatService] POST /api/v1/query →", {
    question: message,
    document_id,
  });

  const response = await axiosInstance.post("query", {
    question: message,
    document_id,
  });

  // The backend returns "Answer with citations" — adapt based on actual response shape
  // Common shapes: { answer } | { content } | { response } | plain string
  const data = response.data;
  const content =
    data?.answer ??
    data?.content ??
    data?.response ??
    (typeof data === "string" ? data : "Maaf, tidak ada jawaban dari server.");

  return { content };
};
