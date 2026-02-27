import { useState } from "react";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const MODES = [
  {
    id: "review",
    label: "Review Contract",
    description:
      "Analyze legal contracts — risk assessment, clause extraction, compliance review.",
    icon: <HiOutlineMagnifyingGlass className="text-lg" />,
  },
  {
    id: "draft",
    label: "Create Contract",
    description:
      "Generate professional legal contracts with AI-guided templates.",
    icon: <HiOutlinePencilSquare className="text-lg" />,
  },
];

/**
 * StudioPanel — right collapsible panel for mode selection.
 *
 * Props:
 *  @param {string|null} activeMode  — 'review' | 'draft' | null
 *  @param {Function}    onSetMode   — (modeId) => void
 */
const StudioPanel = ({ activeMode, onSetMode }) => {
  const [collapsed, setCollapsed] = useState(false);

  const currentMode = MODES.find((m) => m.id === activeMode);

  return (
    <div
      className={`flex flex-col bg-background border border-border rounded-2xl overflow-hidden
                  transition-all duration-300 shrink-0 h-full
                  ${collapsed ? "w-12" : "w-full lg:w-80"}`}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center px-3 py-3 border-b border-border shrink-0">
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surfaceLight transition-colors"
          aria-label={collapsed ? "Expand panel" : "Collapse panel"}
        >
          {collapsed ? (
            <HiOutlineChevronLeft className="text-base" />
          ) : (
            <HiOutlineChevronRight className="text-base" />
          )}
        </button>
        {!collapsed && (
          <span className="text-textPrimary text-sm font-semibold ml-2">
            Mode
          </span>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {collapsed ? (
        // Icon strip
        <div className="flex flex-col items-center py-3 gap-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => onSetMode(m.id)}
              title={m.label}
              className={`p-2 rounded-lg transition-colors ${
                activeMode === m.id
                  ? "bg-primary/20 text-primary"
                  : "text-textSecondary hover:text-textPrimary hover:bg-surface"
              }`}
            >
              {m.icon}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
          {/* Mode cards */}
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => onSetMode(m.id === activeMode ? null : m.id)}
              className={`w-full text-left flex flex-col gap-2 p-3 rounded-xl border
                          transition-all duration-200
                          ${
                            activeMode === m.id
                              ? "bg-primary/15 border-primary/40"
                              : "border-border hover:border-primary/30 hover:bg-surface"
                          }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    activeMode === m.id
                      ? "bg-primary/30 text-primary"
                      : "bg-surfaceLight text-textSecondary"
                  }`}
                >
                  {m.icon}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    activeMode === m.id
                      ? "text-textPrimary"
                      : "text-textSecondary"
                  }`}
                >
                  {m.label}
                </span>
              </div>
              <p className="text-xs text-textSecondary leading-relaxed">
                {m.description}
              </p>
            </button>
          ))}

          {/* Active mode indicator */}
          <div className="mt-2 p-3 rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-textSecondary font-medium">
                Active Mode
              </span>
            </div>
            <p className="text-xs text-textPrimary">
              {currentMode
                ? `${currentMode.label} — Upload files and ask questions.`
                : "No mode selected. Choose a mode to get started."}
            </p>
          </div>

          {/* Output placeholder */}
          {!activeMode && (
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2 text-center">
              <HiOutlineCheckCircle className="text-textSecondary/30 text-4xl" />
              <p className="text-textSecondary/60 text-xs leading-relaxed">
                File output will be saved here.
                <br />
                After adding sources, choose a feature to get started.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudioPanel;
