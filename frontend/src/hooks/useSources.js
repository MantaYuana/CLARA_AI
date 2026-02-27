import { useState } from "react";
import * as yup from "yup";
import toast from "react-hot-toast";
import { analyzeFile } from "../Services/sourceService";

const MAX_FILES = 5;
const MAX_SIZE_MB = 10;
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Yup schema for validating incoming files
const fileArraySchema = yup.array().of(
  yup
    .mixed()
    .test("fileSize", `Ukuran file maksimal ${MAX_SIZE_MB}MB`, (f) =>
      f ? f.size <= MAX_SIZE_MB * 1024 * 1024 : true,
    )
    .test("fileType", "Format tidak didukung. Gunakan PDF atau DOCX", (f) =>
      f ? ACCEPTED_TYPES.includes(f.type) : true,
    ),
);

/**
 * useSources — manages uploaded/analyzed file sources.
 *
 * Returns:
 *  sources         : all source objects
 *  selectedCount   : number of selected sources
 *  processFiles    : (FileList|File[]) => void
 *  toggleSelect    : (id) => void
 *  removeSource    : (id) => void
 */
const useSources = () => {
  const [sources, setSources] = useState([]);

  const selectedCount = sources.filter((s) => s.selected).length;

  const processFiles = async (fileList) => {
    const incoming = Array.from(fileList);

    // Guard: total file count
    if (sources.length + incoming.length > MAX_FILES) {
      toast.error(
        `Maksimal ${MAX_FILES} file. Saat ini sudah ada ${sources.length} file.`,
      );
      return;
    }

    // Validate with yup
    try {
      await fileArraySchema.validate(incoming);
    } catch (err) {
      toast.error(err.message);
      return;
    }

    // Optimistically add files in 'analyzing' state
    const pending = incoming.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      file: f,
      status: "analyzing", // 'analyzing' | 'ready' | 'error'
      selected: false,
    }));

    setSources((prev) => [...prev, ...pending]);

    // Analyze each file sequentially
    for (const item of pending) {
      try {
        await analyzeFile(item.file);
        setSources((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, status: "ready" } : s)),
        );
        toast.success(`"${item.name}" berhasil dianalisa`);
      } catch {
        setSources((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, status: "error" } : s)),
        );
        toast.error(`Gagal menganalisa "${item.name}"`);
      }
    }
  };

  const toggleSelect = (id) =>
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)),
    );

  const removeSource = (id) =>
    setSources((prev) => prev.filter((s) => s.id !== id));

  return { sources, selectedCount, processFiles, toggleSelect, removeSource };
};

export default useSources;
