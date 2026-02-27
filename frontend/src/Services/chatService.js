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
  const payload = {
    question: message,
  };

  if (fileIds && fileIds.length > 0) {
    payload.document_id = fileIds[0];
  }

  const response = await axiosInstance.post("query", payload, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  const data = response.data.data;

  const content =
    data?.answer ??
    data?.content ??
    data?.response ??
    data?.result ??
    data?.message ??
    (typeof data === "string" ? data : JSON.stringify(data));

  const confidenceScore =
    data?.confidence_score ?? data?.confidence ?? data?.score ?? null;

  const citations = data?.citations ?? data?.sources ?? data?.references ?? [];

  return { content, confidenceScore, citations };
};

