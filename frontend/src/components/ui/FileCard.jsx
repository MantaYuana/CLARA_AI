import { HiOutlineDocumentText } from "react-icons/hi2";

const FileCard = ({ file }) => {
  return (
    <div
      className="group relative flex flex-col justify-center gap-3 p-5 rounded-xl bg-surface border border-border
      cursor-pointer transition-all duration-200
      hover:border-primary/40 hover:bg-surfaceLight hover:shadow-lg hover:shadow-primary/5
      animate-fadeIn"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center
          group-hover:bg-primary/25 transition-colors duration-200"
        >
          <HiOutlineDocumentText className="text-primary text-lg" />
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-medium text-sm text-textPrimary line-clamp-2">
            {file.name}
          </h3>
          <p className="text-xs text-textSecondary">{file.size}</p>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
