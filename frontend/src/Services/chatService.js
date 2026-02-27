import { axiosInstance } from "../lib/axios";

const DUMMY_RESPONSES = [
  "Berdasarkan dokumen yang Anda upload, saya menemukan beberapa klausul yang perlu diperhatikan, terutama pada bagian penghentian kontrak (Pasal 12.3). Disarankan untuk menambahkan klausul force majeure yang lebih spesifik.",
  "Kontrak ini memiliki risiko sedang. Pasal 5.2 tentang ganti rugi memiliki cakupan yang terlalu luas dan sebaiknya dibatasi. Selain itu, ada ketidakjelasan pada definisi 'Default' yang bisa menjadi celah hukum.",
  "Saya telah menganalisa seluruh kontrak. Secara keseluruhan sudah cukup baik, namun klausul kerahasiaan pada Pasal 8 perlu diperkuat dengan menyertakan hukuman yang jelas untuk pelanggaran.",
  "Berdasarkan analisa hukum, pasal kerahasiaan dalam dokumen ini sudah sesuai dengan standar industri. Namun, saya merekomendasikan penambahan klausul arbitrase sebagai mekanisme penyelesaian sengketa.",
];

/**
 * Send a chat message to the AI.
 * Replace the dummy body with the real axios call when the backend is ready.
 *
 * @param {{ message: string, fileIds: string[], mode: string|null }} payload
 * @returns {Promise<{ content: string }>}
 */
export const sendMessage = async ({ message, fileIds, mode }) => {
  // TODO: replace with real API call
  // const response = await axiosInstance.post("/api/v1/chat", { message, fileIds, mode });
  // return response.data;

  console.log("[chatService] Sending message:", { message, fileIds, mode });
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
  const content =
    DUMMY_RESPONSES[Math.floor(Math.random() * DUMMY_RESPONSES.length)];
  return { content };
};
