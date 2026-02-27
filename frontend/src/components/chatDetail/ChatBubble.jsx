import ReactMarkdown from "react-markdown";
import { HiOutlineSparkles } from "react-icons/hi2";
import { HiUser } from "react-icons/hi";

/**
 * ChatBubble — renders one chat message.
 * AI (assistant) responses are rendered as Markdown for proper formatting.
 *
 * Props:
 *  @param {Object} message
 *  @param {string} message.role    — 'user' | 'assistant'
 *  @param {string} message.content
 * @param {Object} user            — for future use; can be used to show different avatars for multiple users
 */
const ChatBubble = ({ message, user }) => {
  const isUser = message.role === "user";

  const name = user?.name || "User";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (isUser) {
    return (
      <div className="flex justify-end px-4 max-w-full">
        <div className="flex items-end gap-2 max-w-[75%]">
          <div
            className="px-4 py-3 rounded-2xl shadow-md dark:shadow-none rounded-br-sm text-sm leading-relaxed
                       dark:bg-primary/20 bg-primary text-white dark:text-textPrimary border border-primary/20 whitespace-pre-wrap"
          >
            {message.content}
          </div>
          <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-primary/50 bg-surfaceLight border border-primary dark:border-border flex items-center justify-center shrink-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center
                          bg-linear-to-br from-secondary to-primary text-white
                          text-sm font-semibold"
              >
                {initials}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Assistant — render as Markdown
  return (
    <div className="flex justify-start px-4">
      <div className="flex items-start gap-2 max-w-[80%]">
        {/* CLARA icon */}
        <div className="w-7 h-7 rounded-full  dark:bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
          <HiOutlineSparkles className="text-primary text-sm" />
        </div>

        {/* Markdown-rendered response */}
        <div
          className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed
                     dark:bg-surface  border dark:shadow-none shadow-md border-primary/20 dark:border-border dark:text-textPrimary
                     prose prose-sm prose-invert max-w-none"
        >
          <ReactMarkdown
            components={{
              // Paragraphs
              p: ({ children }) => (
                <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
              ),
              // Bold
              strong: ({ children }) => (
                <strong className="font-semibold dark:text-textPrimary">
                  {children}
                </strong>
              ),
              // Italic
              em: ({ children }) => (
                <em className="italic text-textSecondary">{children}</em>
              ),
              // Unordered list
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 my-2 pl-1">
                  {children}
                </ul>
              ),
              // Ordered list
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 my-2 pl-1">
                  {children}
                </ol>
              ),
              // List item
              li: ({ children }) => (
                <li className="text-textPrimary leading-relaxed">{children}</li>
              ),
              // Inline code
              code: ({ inline, children }) =>
                inline ? (
                  <code className="px-1.5 py-0.5 rounded bg-surfaceLight text-primary text-xs font-mono">
                    {children}
                  </code>
                ) : (
                  <pre className="mt-2 p-3 rounded-xl bg-backgroundBlack border border-border overflow-x-auto">
                    <code className="text-xs font-mono text-textSecondary">
                      {children}
                    </code>
                  </pre>
                ),
              // Headings
              h1: ({ children }) => (
                <h1 className="text-base font-bold text-textPrimary mt-3 mb-1">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-sm font-bold text-textPrimary mt-3 mb-1">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold text-textPrimary mt-2 mb-1">
                  {children}
                </h3>
              ),
              // Horizontal rule
              hr: () => <hr className="border-border my-3" />,
              // Blockquote
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-textSecondary italic">
                  {children}
                </blockquote>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

/** Typing indicator bubble */
export const TypingBubble = () => (
  <div className="flex justify-start px-4">
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
        <HiOutlineSparkles className="text-primary text-sm" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm dark:bg-surface border border-border">
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
