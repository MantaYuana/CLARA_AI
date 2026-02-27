import ReactMarkdown from "react-markdown";
import {
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineShieldExclamation,
} from "react-icons/hi2";
import {
  HiUser,
  HiOutlineExternalLink,
  HiOutlineDocumentText,
} from "react-icons/hi";

// ── Confidence score helpers ─────────────────────────────────────────────────

/**
 * Returns Tailwind color classes and label based on score (0–1).
 * ≥ 0.75  → green  (High)
 * 0.45–0.74 → yellow (Medium)
 * < 0.45  → red    (Low)
 */
const getScoreStyle = (score) => {
  if (score === null || score === undefined) return null;
  const pct = Math.round(score * 100);
  if (score >= 0.75) {
    return {
      pct,
      label: "High Confidence",
      bar: "bg-green-500",
      text: "text-green-400",
      border: "border-green-500/30",
      bg: "bg-green-500/10",
      dot: "bg-green-400",
    };
  }
  if (score >= 0.45) {
    return {
      pct,
      label: "Medium Confidence",
      bar: "bg-yellow-500",
      text: "text-yellow-400",
      border: "border-yellow-500/30",
      bg: "bg-yellow-500/10",
      dot: "bg-yellow-400",
    };
  }
  return {
    pct,
    label: "Low Confidence",
    bar: "bg-red-500",
    text: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
  };
};

// ── LabelBadge (review mode: aman/berbahaya) ─────────────────────────────────
const LabelBadge = ({ label }) => {
  if (!label) return null;
  const isSafe = label.toLowerCase() === "aman";
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold
                  ${
                    isSafe
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
    >
      {isSafe ? (
        <HiOutlineShieldCheck className="text-base shrink-0" />
      ) : (
        <HiOutlineShieldExclamation className="text-base shrink-0" />
      )}
      Contract Assessment: <span className="uppercase ml-1">{label}</span>
    </div>
  );
};

// ── ClauseList (review mode: relevant clauses) ───────────────────────────────
const ClauseList = ({ clauses }) => {
  if (!clauses || clauses.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-border/60">
      <p className="text-[10px] uppercase tracking-widest text-textSecondary/60 font-semibold mb-2">
        Relevant Clauses
      </p>
      <div className="flex flex-col gap-1.5">
        {clauses.map((clause, idx) => (
          <div
            key={idx}
            className="px-2.5 py-2 rounded-lg bg-backgroundBlack/60 border border-border/40"
          >
            <p className="text-[10px] text-textSecondary/50 font-semibold mb-0.5">
              Clause {clause.index ?? idx + 1}
            </p>
            <p className="text-xs text-textSecondary leading-snug">
              {clause.content_preview ?? clause.content}
            </p>
            {clause.legal_relevance && (
              <p className="text-[10px] text-primary/70 mt-1 italic">
                {clause.legal_relevance}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── ConfidenceBar ────────────────────────────────────────────────────────────
const ConfidenceBar = ({ score }) => {
  const style = getScoreStyle(score);
  if (!style) return null;

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${style.border} ${style.bg}`}
    >
      {/* Dot */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {/* Label */}
      <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
      {/* Progress bar */}
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
          style={{ width: `${style.pct}%` }}
        />
      </div>
      {/* Percentage */}
      <span className={`text-xs font-semibold tabular-nums ${style.text}`}>
        {style.pct}%
      </span>
    </div>
  );
};

// ── CitationList ─────────────────────────────────────────────────────────────
const CitationList = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/60">
      <p className="text-[10px] uppercase tracking-widest text-textSecondary/60 font-semibold mb-2">
        Sources
      </p>
      <div className="flex flex-col gap-1.5">
        {citations.map((cite, idx) => {
          // Support both string citations and object citations
          const isObj = typeof cite === "object" && cite !== null;
          const title = isObj
            ? (cite.title ?? cite.name ?? cite.text ?? `Source ${idx + 1}`)
            : cite;
          const url = isObj ? (cite.url ?? cite.link ?? null) : null;
          const page = isObj ? (cite.page ?? cite.page_number ?? null) : null;

          return (
            <div
              key={idx}
              className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-backgroundBlack/60 border border-border/40
                         hover:border-primary/30 transition-colors duration-150"
            >
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-textSecondary text-xs leading-snug truncate">
                  {title}
                </p>
                {page && (
                  <p className="text-textSecondary/50 text-[10px] mt-0.5">
                    Page {page}
                  </p>
                )}
              </div>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-textSecondary/50 hover:text-primary transition-colors shrink-0"
                >
                  <HiOutlineExternalLink className="text-sm" />
                </a>
              ) : (
                <HiOutlineDocumentText className="text-textSecondary/30 text-sm shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Markdown components ──────────────────────────────────────────────────────
const mdComponents = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-textPrimary">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-textSecondary">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 my-2 pl-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 my-2 pl-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-textPrimary leading-relaxed">{children}</li>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded bg-surfaceLight text-primary text-xs font-mono">
        {children}
      </code>
    ) : (
      <pre className="mt-2 p-3 rounded-xl bg-backgroundBlack border border-border overflow-x-auto">
        <code className="text-xs font-mono text-textSecondary">{children}</code>
      </pre>
    ),
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-textPrimary mt-3 mb-1">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-textPrimary mt-3 mb-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-textPrimary mt-2 mb-1">
      {children}
    </h3>
  ),
  hr: () => <hr className="border-border my-3" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-textSecondary italic">
      {children}
    </blockquote>
  ),
};

// ── ChatBubble ───────────────────────────────────────────────────────────────
/**
 * ChatBubble — renders one chat message.
 *
 * Props:
 *  @param {Object}   message
 *  @param {string}   message.role             — 'user' | 'assistant'
 *  @param {string}   message.content
 *  @param {number|null} message.confidenceScore — 0–1 float (assistant only)
 *  @param {Array}    message.citations         — citation objects (assistant only)
 */
const ChatBubble = ({ message }) => {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end px-4 max-w-full">
        <div className="flex items-end gap-2 max-w-[75%]">
          <div
            className="px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed
                       bg-primary/20 text-textPrimary border border-primary/20 whitespace-pre-wrap"
          >
            {message.content}
          </div>
          <div className="w-7 h-7 rounded-full bg-surfaceLight border border-border flex items-center justify-center shrink-0">
            <HiUser className="text-textSecondary text-sm" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex justify-start px-4">
      <div className="flex items-start gap-2 max-w-[82%]">
        {/* CLARA icon */}
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
          <HiOutlineSparkles className="text-primary text-sm" />
        </div>

        {/* Bubble */}
        <div
          className="flex flex-col gap-3 px-4 py-3 rounded-2xl rounded-bl-sm
                        bg-surface border border-border text-textPrimary min-w-0"
        >
          {/* ── Review mode: contract label (aman / berbahaya) ── */}
          <LabelBadge label={message.label} />

          {/* ── Markdown content ── */}
          <div className="text-sm leading-relaxed">
            <ReactMarkdown components={mdComponents}>
              {message.content}
            </ReactMarkdown>
          </div>

          {/* ── Confidence score bar ── */}
          {message.confidenceScore !== null &&
            message.confidenceScore !== undefined && (
              <ConfidenceBar score={message.confidenceScore} />
            )}

          {/* ── Citations ── */}
          <CitationList citations={message.citations} />

          {/* ── Review mode: relevant clauses ── */}
          <ClauseList clauses={message.clauses} />
        </div>
      </div>
    </div>
  );
};

// ── TypingBubble ─────────────────────────────────────────────────────────────
export const TypingBubble = () => (
  <div className="flex justify-start px-4">
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
        <HiOutlineSparkles className="text-primary text-sm" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-surface border border-border">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-textSecondary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default ChatBubble;
