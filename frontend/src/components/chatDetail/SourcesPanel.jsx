import { useState } from "react";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCloudArrowUp,
  HiOutlineDocument,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineXMark,
} from "react-icons/hi2";
import UploadModal from "./UploadModal";

const formatBytes = (b) => {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const statusIcon = (status) => {
  if (status === "analyzing")
    return (
      <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin block shrink-0" />
    );
  if (status === "ready")
    return (
      <HiOutlineCheckCircle className="text-green-400 text-base shrink-0" />
    );
  return (
    <HiOutlineExclamationCircle className="text-red-400 text-base shrink-0" />
  );
};

/**
 * SourcesPanel — left collapsible panel for file management.
 *
 * Props:
 *  @param {Array}    sources       — from useSources
 *  @param {number}   selectedCount — currently selected source count
 *  @param {Function} onProcessFiles — (files) => void
 *  @param {Function} onToggleSelect — (id) => void
 *  @param {Function} onRemoveSource — (id) => void
 */
const SourcesPanel = ({
  sources,
  selectedCount,
  onProcessFiles,
  onToggleSelect,
  onRemoveSource,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        className={`flex flex-col border-r border-border bg-surface transition-all duration-300 shrink-0
                    ${collapsed ? "w-12" : "w-60"}`}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border shrink-0">
          {!collapsed && (
            <span className="text-textPrimary text-sm font-semibold">
              Upload File
            </span>
          )}
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="ml-auto p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surfaceLight transition-colors"
            aria-label={collapsed ? "Expand panel" : "Collapse panel"}
          >
            {collapsed ? (
              <HiOutlineChevronRight className="text-base" />
            ) : (
              <HiOutlineChevronLeft className="text-base" />
            )}
          </button>
        </div>

        {/* ── Content (hidden when collapsed) ───────────────────────────── */}
        {collapsed ? (
          // Icon strip
          <div className="flex flex-col items-center py-3 gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="p-2 rounded-lg text-textSecondary hover:text-primary hover:bg-surfaceLight transition-colors"
              title="Upload File"
            >
              <HiOutlineCloudArrowUp className="text-xl" />
            </button>
            {sources.length > 0 && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">
                  {sources.length}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 gap-3 p-3 overflow-y-auto">
            {/* Upload button */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                         border border-dashed border-border text-textSecondary text-sm
                         hover:border-primary/50 hover:text-primary hover:bg-primary/5
                         transition-all duration-200"
            >
              <HiOutlineCloudArrowUp className="text-base" />
              Upload File
            </button>

            {/* File list */}
            {sources.length === 0 ? (
              <p className="text-textSecondary text-xs text-center mt-4">
                Belum ada file. Upload kontrak untuk mulai.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {sources.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => s.status === "ready" && onToggleSelect(s.id)}
                    className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg
                                transition-all duration-150 cursor-pointer
                                ${
                                  s.selected
                                    ? "bg-primary/15 border border-primary/30"
                                    : "hover:bg-surfaceLight border border-transparent"
                                }
                                ${s.status !== "ready" ? "cursor-default" : ""}`}
                  >
                    {/* Status indicator */}
                    {statusIcon(s.status)}

                    {/* File name */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium truncate ${
                          s.selected ? "text-primary" : "text-textPrimary"
                        }`}
                      >
                        {s.name}
                      </p>
                      {s.status === "analyzing" && (
                        <p className="text-textSecondary text-[10px]">
                          Menganalisa...
                        </p>
                      )}
                    </div>

                    {/* Remove button */}
                    {s.status !== "analyzing" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSource(s.id);
                        }}
                        className="p-0.5 opacity-0 group-hover:opacity-100 text-textSecondary hover:text-red-400 transition-all"
                      >
                        <HiOutlineXMark className="text-sm" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Upload modal */}
      <UploadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpload={(files) => onProcessFiles(files)}
        currentCount={sources.length}
      />
    </>
  );
};

export default SourcesPanel;
