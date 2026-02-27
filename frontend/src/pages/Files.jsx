import Navbar from "../components/layout/Navbar";
import { HiOutlineDocument } from "react-icons/hi";
import { HiOutlineDocumentText, HiOutlineClock } from "react-icons/hi2";

const dummyFiles = [
  {
    id: 1,
    name: "Project Proposal.pdf",
    size: "2.3 MB",
    uploadedAt: "2024-06-01",
  },
  {
    id: 2,
    name: "Design Mockup.png",
    size: "1.8 MB",
    uploadedAt: "2024-06-03",
  },
  {
    id: 3,
    name: "Meeting Notes.docx",
    size: "500 KB",
    uploadedAt: "2024-06-05",
  },
];

const Files = () => {
  return (
    <div className="min-h-screen bg-backgroundBlack flex flex-col">
      <Navbar />
      <div className="flex-1 flex justify-center">
        {dummyFiles.length > 0 ? (
          <div className="max-w-3xl px-4">
            <div className="flex flex-col items-center text-center pt-16 pb-10 px-4 animate-fadeIn">
              <h1 className="text-3xl md:text-4xl font-bold text-textPrimary leading-tight">
                My Files
              </h1>
              <p className="mt-3 text-textSecondary text-sm md:text-base">
                Here are the files you've uploaded. You can manage and organize
                them as needed.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dummyFiles.map((file) => (
                <div
                  key={file.id}
                  className="group relative flex flex-col gap-3 p-5 rounded-xl bg-surface border border-border
                 cursor-pointer transition-all duration-200
                 hover:border-primary/40 hover:bg-surfaceLight hover:shadow-lg hover:shadow-primary/5
                 animate-fadeIn"
                >
                  <div className="flex items-center justify-center gap-4">
                    <div
                      className="w-9 h-9 mx-2 rounded-lg bg-primary/15 flex items-center justify-center
                      group-hover:bg-primary/25 transition-colors duration-200"
                    >
                      <HiOutlineDocumentText className="text-primary text-lg" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium text-sm text-textPrimary line-clamp-2">
                        {file.name}
                      </h3>
                      <p className="text-xs text-textSecondary">{file.size}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center animate-fadeIn">
            <HiOutlineFolder className="text-5xl text-textSecondary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-textPrimary mb-2">
              My Files
            </h2>
            <p className="text-sm text-textSecondary">
              Your uploaded files will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Files;
