import { useState, useEffect } from "react";
import Navbar from "../components/layout/Navbar";
import FilesHero from "../components/ui/FilesHero";
import FilesGrid from "../components/ui/FilesGrid";
import FilesEmpty from "../components/ui/FilesEmpty";

const dummyFiles = [
  {
    id: 1,
    name: "Project Proposal.pdf",
    size: "2.3 MB",
    uploadedAt: "2024-06-01",
  },
  {
    id: 2,
    name: "Final Presentation.pptx",
    size: "1.8 MB",
    uploadedAt: "2024-06-03",
  },
  {
    id: 3,
    name: "Meeting Notes.docx",
    size: "500 KB",
    uploadedAt: "2024-06-05",
  },
  {
    id: 4,
    name: "User Research Report.pdf",
    size: "3.5 MB",
    uploadedAt: "2024-06-07",
  },
  {
    id: 5,
    name: "Design Mockup.png",
    size: "2.2 MB",
    uploadedAt: "2024-06-09",
  },
];

const Files = () => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // simulate fetch
  useEffect(() => {
    setTimeout(() => {
      setFiles(dummyFiles);
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen dark:bg-backgroundBlack flex flex-col">
      <Navbar />

      <div className="flex-1 flex justify-center">
        <div className="max-w-3xl w-full px-4">
          <FilesHero />

          {isLoading ? (
            <FilesGrid isLoading />
          ) : files.length > 0 ? (
            <FilesGrid files={files} />
          ) : (
            <FilesEmpty />
          )}
        </div>
      </div>
    </div>
  );
};

export default Files;
