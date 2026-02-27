import { HiOutlineSparkles } from "react-icons/hi2";
import { HiUser } from "react-icons/hi";

/**
 * ChatBubble — renders one chat message.
 *
 * Props:
 *  @param {Object} message
 *  @param {string} message.role   — 'user' | 'assistant'
 *  @param {string} message.content
 */
const ChatBubble = ({ message }) => {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end px-4 max-w-full">
        <div className="flex items-end gap-2 max-w-[75%]">
          <div
            className="px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed
                       bg-primary/20 text-textPrimary border border-primary/20"
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

  return (
    <div className="flex justify-start px-4">
      <div className="flex items-end gap-2 max-w-[80%]">
        {/* CLARA icon */}
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          <HiOutlineSparkles className="text-primary text-sm" />
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed
                     bg-surface border border-border text-textPrimary"
        >
          {message.content}
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
