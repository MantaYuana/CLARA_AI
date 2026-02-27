import { axiosInstance } from "../lib/axios";

/**
 * Analyze a single uploaded file.
 * Replace the dummy body with the real axios call when the backend is ready.
 *
 * @param {File} file - browser File object
 * @returns {Promise<{ fileId: string, name: string }>}
 */
export const analyzeFile = async (file) => {
  // TODO: replace with real API call
  // const formData = new FormData();
  // formData.append("file", file);
  // const response = await axiosInstance.post("/api/v1/analyze", formData, {
  //   headers: { "Content-Type": "multipart/form-data" },
  // });
  // return response.data;

  console.log("[sourceService] Analyzing file:", file.name);
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1500));
  console.log("[sourceService] Done analyzing:", file.name);
  return { fileId: `file-${Date.now()}`, name: file.name };
};
