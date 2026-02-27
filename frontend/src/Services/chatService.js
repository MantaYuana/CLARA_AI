import { axiosInstance } from "../lib/axios";

/**
 * Returns the Authorization header using the token from localStorage.
 * Same pattern as useAuth.js.
 */
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Dummy document_id — replace with real ID from analyze response when backend is ready
const DUMMY_DOCUMENT_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

/**
 * sendMessage — POST /api/v1/query
 *
 * Body: { question: string, document_id: string }
 * Auth: Bearer token from localStorage
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

  console.log("[chatService] Raw response:", response.data);

  const data = response.data.data;

  // Handle multiple possible response shapes from backend
  // Update the key here if backend uses a different field name
  const content =
    data?.answer ??
    data?.content ??
    data?.response ??
    data?.result ??
    data?.message ??
    (typeof data === "string" ? data : JSON.stringify(data));

  return { content };
};
