import { axiosInstance } from "../lib/axios";

/**
 * analyzeFile — uploads a file to the analyze endpoint.
 *
 * Endpoint : POST /api/v1/analyze   (path relative to VITE_API_URL)
 * Body     : multipart/form-data   { file: File }
 * Response : document_id (string) and any other metadata returned by backend
 *
 * TODO: update the response destructuring once the exact response shape is confirmed.
 *       Common shapes handled: { document_id } | { id } | { doc_id }
 *
 * @param {File} file — browser File object from the upload input
 * @returns {Promise<{ documentId: string }>}
 */
export const analyzeFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  console.log("[sourceService] Uploading file for analysis:", file.name);

  const response = await axiosInstance.post("document/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  console.log(
    "[sourceService] Analyze response for:",
    file.name,
    response.data,
  );

  // Adapt to actual response shape — update the key if backend uses a different name
  const documentId =
    response.data?.document_id ??
    response.data?.id ??
    response.data?.doc_id ??
    null;

  return { documentId, raw: response.data };
};
