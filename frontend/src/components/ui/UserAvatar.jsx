import { useState, useRef, useEffect } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

/**
 * UserAvatar — circular photo/initials button with Google-style user dropdown.
 *
 * Props:
 *  @param {Object} user
 *  @param {string} user.name
 *  @param {string} user.email
 *  @param {string|null} user.photoURL
 *  @param {Function} [onSignOut]
 */
const UserAvatar = ({ user, onSignOut }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // 🛡 Guard clause
  if (!user) return null;

  const name = user.name || "User";
  const email = user.email || "";
  const photoURL = user.photoURL || user.photoUrl || null;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Avatar trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-9 h-9 rounded-full overflow-hidden
                   ring-2 ring-primary/50 hover:ring-primary
                   transition-all duration-200 shrink-0"
        aria-label="Open user menu"
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={name}
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
      </button>

      {/* Google-style user dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl border dark:border-border
                     dark:bg-surface shadow-2xl shadow-black/50 z-50 overflow-hidden
                     animate-fadeIn"
        >
          {/* Header — email + close */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="dark:text-textSecondary text-xs truncate">
              {email}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full dark:text-textSecondary dark:hover:text-textPrimary
                         hover:bg-surfaceLight transition-colors"
            >
              <HiOutlineXMark className="text-base" />
            </button>
          </div>

          {/* User info section */}
          <div className="flex flex-col items-center gap-3 px-6 py-6">
            {/* Large avatar with Google-style rainbow ring */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center
                         bg-linear-to-br from-secondary to-primary text-white
                         text-2xl font-bold
                         ring-4 ring-offset-2 dark:ring-offset-surface ring-primary/60"
              style={{
                background: photoURL
                  ? undefined
                  : "linear-gradient(135deg, #f0a4fe, #bb11ee)",
              }}
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={name}
                  className="w-full h-full rounded-full object-cover shrink-0"
                />
              ) : (
                initials
              )}
            </div>

            {/* Greeting */}
            <div className="text-center">
              <p className="dark:text-textPrimary font-semibold text-base">
                Hi, {name.split(" ")[0]}!
              </p>
              <p className="dark:text-textSecondary text-xs mt-0.5">
                {email}
              </p>
            </div>

            {/* Manage account button */}
            <button
              className="mt-1 w-full py-2 px-4 rounded-full border border-primary/40
                         dark:text-primary text-sm font-medium
                         hover:bg-primary/10 transition-colors duration-200"
              onClick={() => setOpen(false)}
            >
              Manage your Account
            </button>
          </div>

          {/* Footer — Sign out */}
          <div className="border-t border-border/60 px-4 py-3">
            <button
              onClick={() => {
                setOpen(false);
                onSignOut?.();
              }}
              className="w-full text-center text-xs text-textSecondary
                         hover:text-textPrimary transition-colors duration-150"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
