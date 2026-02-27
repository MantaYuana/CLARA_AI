import { Link, useLocation } from "react-router-dom";
import { HiOutlineDocumentText, HiOutlineFolder } from "react-icons/hi2";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="flex items-center justify-between px-4 md:px-6 py-3 bg-backgroundBlack border-b border-border">
      <Link to="/" className="flex items-center gap-2 group">
        <span className="text-2xl font-semibold tracking-tight bg-linear-to-b from-secondary to-primary bg-clip-text text-transparent">
          Clara.
        </span>
      </Link>
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
      </div>
    </nav>
  );
};

export default Navbar;
