import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineMoon,
  HiOutlineSun,
} from "react-icons/hi2";
import SettingsDropdown from "../ui/SettingsDropdown";
import UserAvatar from "../ui/UserAvatar";
import { useEffect, useState } from "react";
import { TiDocumentAdd } from "react-icons/ti";

/**
 * ChatDetailTopbar — minimal topbar for the chat detail page.
 * Left: Clara. logo | Center: project title | Right: Back button
 *
 * Props:
 * @param {string} projectTitle
 * @param {object} user  — for UserAvatar; if not passed, will useAuth() internally
 */
const ChatDetailTopbar = ({ projectTitle = projectTitle, user = user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Theme init
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }

    setIsDark(!isDark);
  };

  return (
    <header className="flex items-center min-w-full justify-between px-6 md:px-10 py-3 bg-white dark:bg-backgroundBlack border-b border-gray-300 dark:border-border shrink-0 z-40">
      <div className="w-full">
        {/* Left — Logo */}
        <Link to="/">
          <span className="text-xl font-semibold tracking-tight bg-linear-to-b from-secondary to-primary bg-clip-text text-transparent">
            Clara.
          </span>
        </Link>
      </div>

      <div className="w-full flex justify-center">
        {/* Center — Project title */}
        <span className="dark:text-textPrimary text-sm font-medium truncate max-w-xs text-center">
          {projectTitle}
        </span>
      </div>

      <div className="w-full flex justify-end">
        {/* Right — Back */}
        <div className="flex items-center gap-2">
          {/* Projects */}
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              location.pathname === "/"
                ? "dark:bg-surfaceLight border-surfaceLight border text-primary"
                : "dark:text-textSecondary hover:text-textPrimary hover:bg-surface"
            }`}
          >
            <TiDocumentAdd className="text-base" />
            <span className="hidden xl:inline">Create New Chat</span>
          </Link>

          {/* My Files */}
          {/* <Link
          to="/my-files"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            location.pathname === "/my-files"
              ? "dark:bg-surfaceLight border-surfaceLight border text-primary"
              : "dark:text-textSecondary hover:text-textPrimary hover:bg-surface"
          }`}
        >
          <HiOutlineFolder className="text-base" />
          <span className="hidden sm:inline">My Files</span>
        </Link> */}

          <div className="w-px h-5 bg-border mx-2" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-surface transition duration-200"
          >
            {isDark ? (
              <HiOutlineMoon className="text-gray-700 text-lg" />
            ) : (
              <HiOutlineSun className="text-yellow-400 text-lg" />
            )}
          </button>

          <SettingsDropdown />

          <div className="w-px h-5 bg-border mx-2" />

          <UserAvatar user={user} />
        </div>
      </div>
    </header>
  );
};

export default ChatDetailTopbar;
