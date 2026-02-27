import { Link, useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi2";

/**
 * ChatDetailTopbar — minimal topbar for the chat detail page.
 * Left: Clara. logo | Center: project title | Right: Back button
 *
 * Props:
 *  @param {string} projectTitle
 */
const ChatDetailTopbar = ({ projectTitle = "Untitled Project" }) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-backgroundBlack border-b border-border shrink-0 z-40">
      {/* Left — Logo */}
      <Link to="/">
        <span className="text-xl font-semibold tracking-tight bg-linear-to-b from-secondary to-primary bg-clip-text text-transparent">
          Clara.
        </span>
      </Link>

      {/* Center — Project title */}
      <span className="text-textPrimary text-sm font-medium truncate max-w-xs text-center">
        {projectTitle}
      </span>

      {/* Right — Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-textSecondary text-sm
                   hover:text-textPrimary transition-colors duration-150"
      >
        <HiOutlineArrowLeft className="text-base" />
        <span>Back</span>
      </button>
    </header>
  );
};

export default ChatDetailTopbar;
