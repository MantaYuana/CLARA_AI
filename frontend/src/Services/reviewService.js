import { axiosInstance } from "../lib/axios";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * reviewContract — POST /api/v1/contract/review
 *
 * Full AI-powered contract review pipeline:
 * OCR → guardrail checks → hybrid retrieval → AI reasoning → citations
 *
 * Body (multipart/form-data):
 *  file     : File   — contract document (JPEG/PNG/WebP/TIFF/BMP or PDF, max 25MB)
 *  question : string — specific review question (optional, defaults to general compliance check)
 *
 * Response (200):
 *  {
 *    success        : boolean
 *    question       : string
 *    answer         : string
 *    confidence     : number (0–1)
 *    label          : "aman" | "berbahaya"
 *    rationale      : string
 *    citations      : Array<{ reference: string, source: string }>
 *    clauses        : Array<{ index: number, content_preview: string, legal_relevance: string }>
 *    guardrail      : { has_citations: boolean }
 *  }
 *
 * @param {{ file: File, question: string }} payload
 * @returns {Promise<{ content, confidenceScore, citations, label, clauses, rationale }>}
 */
export const reviewContract = async ({ file, question }) => {
  const formData = new FormData();
  formData.append("file", file);
  if (question) formData.append("question", question);

  console.log("[reviewService] POST /api/v1/contract/review →", {
    file: file.name,
    question,
  });

  const response = await axiosInstance.post("contract/review", formData, {
    headers: { ...getAuthHeader() },
    // NOTE: do NOT set Content-Type manually for FormData
  });

  console.log("[reviewService] Raw response:", response);

  const data = response.data?.data ?? response.data;

  const content = data?.answer ?? data?.content ?? JSON.stringify(data);
  const confidenceScore = data?.confidence ?? data?.confidence_score ?? null;
  const citations = data?.citations ?? [];
  const label = data?.label ?? null; // "aman" | "berbahaya"
  const clauses = data?.clauses ?? [];
  const rationale = data?.rationale ?? null;

  console.log("[reviewService] Parsed →", {
    confidenceScore,
    label,
    citations,
  });

  return { content, confidenceScore, citations, label, clauses, rationale };
};
