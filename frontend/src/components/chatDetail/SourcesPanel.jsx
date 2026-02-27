import { useState, useEffect, useRef } from "react";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCloudArrowUp,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineXMark,
} from "react-icons/hi2";
import { HiOutlineDocumentText } from "react-icons/hi";
import UploadModal from "./UploadModal";

/**
 * SourcesPanel — left collapsible panel for file management.
 *
 * Props:
 * @param {Array}    sources       — from useSources
 * @param {number}   selectedCount — currently selected source count
 * @param {Function} onProcessFiles — (files) => void
 * @param {Function} onToggleSelect — (id) => void
 * @param {Function} onRemoveSource — (id) => void
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

  const [recentlyReadyIds, setRecentlyReadyIds] = useState([]);
  const prevSourcesRef = useRef(sources);

  useEffect(() => {
    const newReadyIds = [];

    sources.forEach((s) => {
      const prev = prevSourcesRef.current.find((p) => p.id === s.id);
      if (s.status === "ready" && (!prev || prev.status !== "ready")) {
        newReadyIds.push(s.id);
      }
    });

    if (newReadyIds.length > 0) {
      setRecentlyReadyIds((prev) => [...prev, ...newReadyIds]);

      newReadyIds.forEach((id) => {
        setTimeout(() => {
          setRecentlyReadyIds((prev) => prev.filter((pId) => pId !== id));
        }, 3000);
      });

      const latestReadyId = newReadyIds[newReadyIds.length - 1];
      const sourceToSelect = sources.find((s) => s.id === latestReadyId);

      if (sourceToSelect && !sourceToSelect.selected) {
        onToggleSelect(latestReadyId);
      }
    }

    prevSourcesRef.current = sources;
  }, [sources, onToggleSelect]);

  const renderStatusIcon = (source) => {
    if (source.status === "analyzing") {
      return (
        <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin block shrink-0" />
      );
    }

    if (source.status === "error") {
      return (
        <HiOutlineExclamationCircle className="text-red-400 text-base shrink-0" />
      );
    }

    if (source.selected || recentlyReadyIds.includes(source.id)) {
      return (
        <HiOutlineCheckCircle className="text-green-400 text-base shrink-0 transition-opacity duration-300" />
      );
    }

    return (
      <div className="w-4 h-4 rounded-full border-[1.5px] border-gray-400 dark:border-gray-500 shrink-0 transition-opacity duration-300" />
    );
  };

  return (
    <>
      <div
        className={`flex flex-col shadow-md border-primary dark:bg-background border dark:border-border rounded-2xl overflow-hidden
                    transition-all duration-300 shrink-0 h-full
                    ${collapsed ? "w-12" : "w-full lg:w-80"}`}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-primary dark:border-border shrink-0">
          {!collapsed && (
            <span className="dark:text-textPrimary text-sm font-semibold">
              Upload File
            </span>
          )}
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="ml-auto p-1.5 rounded-lg cursor-pointer dark:text-textSecondary dark:hover:text-textPrimary hover:bg-gray-200 dark:hover:bg-surfaceLight transition-colors"
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
              className="p-2 rounded-lg text-black dark:text-textSecondary hover:text-primary hover:bg-surface transition-colors"
              title="Upload File"
            >
              <HiOutlineCloudArrowUp className="text-xl" />
            </button>
            {sources.length > 0 && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <span className="dark:text-white text-[10px] font-bold">
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
              className="flex items-center cursor-pointer justify-center gap-2 w-full py-2.5 rounded-xl
                         border border-dashed border-border dark:text-textSecondary text-sm
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
                                    : "dark:hover:bg-surface hover:bg-gray-200 border-surface border"
                                }
                                ${s.status !== "ready" ? "cursor-default" : ""}`}
                  >
                    {/* Menggunakan fungsi render icon yang baru */}
                    {renderStatusIcon(s)}

                    {/* File name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center">
                          <HiOutlineDocumentText className="text-primary text-lg" />
                        </div>
                        <p
                          className={`text-xs font-medium truncate ${
                            s.selected
                              ? "text-primary"
                              : "dark:text-textPrimary text-gray-800"
                          }`}
                        >
                          {s.name}
                        </p>
                      </div>
                      {s.status === "analyzing" && (
                        <p className="dark:text-textSecondary text-[10px]">
                          Analyzing...
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
                        className="p-0.5 opacity-0 group-hover:opacity-100 dark:text-textSecondary hover:text-red-400 transition-all"
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
      />
    </>
  );
};

export default SourcesPanel;
