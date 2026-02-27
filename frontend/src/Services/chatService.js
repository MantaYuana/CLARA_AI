import { axiosInstance } from "../lib/axios";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const DUMMY_DOCUMENT_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

/**
 * sendMessage — POST /api/v1/query
 *
 * Returns: { content, confidenceScore, citations }
 *  - confidenceScore : number 0-1 (or null)
 *  - citations       : array of citation objects (or [])
 */
export const sendMessage = async ({ message, fileIds = [], mode }) => {
  const document_id = fileIds.length > 0 ? fileIds[0] : DUMMY_DOCUMENT_ID;

  console.log("[chatService] POST /api/v1/query →", {
    question: message,
    document_id,
  });

  const response = await axiosInstance.post(
    "query",
    { question: message, document_id },
    { headers: { "Content-Type": "application/json", ...getAuthHeader() } },
  );

  console.log("[chatService] Raw response:", response);

  const data = response.data.data;

  // Main answer text
  const content =
    data?.answer ??
    data?.content ??
    data?.response ??
    data?.result ??
    data?.message ??
    (typeof data === "string" ? data : JSON.stringify(data));

  // Confidence score — expected as 0-1 float (e.g. 0.87)
  // Adjust key if backend uses a different name
  const confidenceScore =
    data?.confidence_score ?? data?.confidence ?? data?.score ?? null;

  // Citations — expected as array of objects
  // Adjust key if backend uses a different name
  const citations = data?.citations ?? data?.sources ?? data?.references ?? [];

  console.log("[chatService] Parsed →", {
    content,
    confidenceScore,
    citations,
  });

  return { content, confidenceScore, citations };
};
