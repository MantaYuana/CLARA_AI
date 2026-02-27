import { HiOutlineDocumentText, HiOutlineClock } from "react-icons/hi2";
import { HiOutlineDocument } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
/**
 * Formats an ISO date string into a relative time label (e.g. "2 jam lalu").
 * @param {string} isoString
 * @returns {string}
 */
const formatRelativeTime = (isoString) => {
  const now = Date.now();
  const diff = now - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
};
/**
 * ProjectCard component.
 *
 * Props:
 *  @param {Object} project - project data object
 *  @param {string} project.id
 *  @param {string} project.title
 *  @param {string} project.description
 *  @param {number} project.sourcesCount
 *  @param {string} project.updatedAt - ISO date string
 */
const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const { id, title, description, sourcesCount, updatedAt } = project;
  return (
    <div
      onClick={() => navigate(`/chat/${id}`)}
      className="group relative flex flex-col gap-3 p-5 rounded-xl bg-surface border border-border
                 cursor-pointer transition-all duration-200
                 hover:border-primary/40 hover:bg-surfaceLight hover:shadow-lg hover:shadow-primary/5
                 animate-fadeIn"
    >
      {/* Document icon */}
      <div
        className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center
                      group-hover:bg-primary/25 transition-colors duration-200"
      >
        <HiOutlineDocumentText className="text-primary text-lg" />
      </div>
      {/* Title & Description */}
      <div className="flex flex-col gap-1">
        <h3
          className="text-textPrimary font-semibold text-sm leading-snug
                       group-hover:text-white transition-colors duration-200 line-clamp-2"
        >
          {title}
        </h3>
        <p className="text-textSecondary text-xs leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
      {/* Footer meta */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/60">
        <div className="flex items-center gap-1.5 text-textSecondary text-xs">
          <HiOutlineDocument className="text-sm" />
          <span>
            {sourcesCount} {sourcesCount === 1 ? "source" : "sources"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-textSecondary text-xs">
          <HiOutlineClock className="text-sm" />
          <span>{formatRelativeTime(updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};
export default ProjectCard;
