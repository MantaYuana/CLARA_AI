import { Link, useLocation } from "react-router-dom";
import { HiOutlineDocumentText, HiOutlineFolder } from "react-icons/hi2";
import SettingsDropdown from "../ui/SettingsDropdown";
import UserAvatar from "../ui/UserAvatar";
import { DUMMY_USER } from "../../constants/dummyUser";

const Navbar = () => {
  const location = useLocation();

  const handleSettingsSelect = (id) => {
    // TODO: handle settings menu actions (help modal, settings page, language picker)
    console.log("Settings action:", id);
  };

  const handleSignOut = () => {
    // TODO: implement Google sign-out
    console.log("Sign out");
  };

  return (
    <nav className="flex items-center justify-between px-6 md:px-10 py-3 bg-backgroundBlack fixed left-0 right-0 z-50">
      {/* ── Left: Logo ────────────────────────────────────── */}
      <Link to="/" className="flex items-center gap-2 group">
        <span className="text-xl md:text-2xl font-semibold tracking-tight bg-linear-to-b from-secondary to-primary bg-clip-text text-transparent">
          Clara.
        </span>
      </Link>

      {/* ── Right: Nav links + Settings + Avatar ──────────── */}
      <div className="flex items-center gap-1">
        <Link
          to="/"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            location.pathname === "/"
              ? "bg-surfaceLight text-primary"
              : "text-textSecondary hover:text-textPrimary hover:bg-surface"
          }`}
        >
          <HiOutlineDocumentText className="text-base" />
          <span className="hidden sm:inline">Projects</span>
        </Link>

        <Link
          to="/my-files"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            location.pathname === "/my-files"
              ? "bg-surfaceLight text-primary"
              : "text-textSecondary hover:text-textPrimary hover:bg-surface"
          }`}
        >
          <HiOutlineFolder className="text-base" />
          <span className="hidden sm:inline">My Files</span>
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-2" />

        {/* Settings dropdown */}
        <SettingsDropdown onSelect={handleSettingsSelect} />

        {/* User avatar dropdown */}
        <div className="ml-1">
          <UserAvatar user={DUMMY_USER} onSignOut={handleSignOut} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
