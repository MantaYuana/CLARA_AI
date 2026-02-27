import React from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlinePlus } from "react-icons/hi2";
import Navbar from "../components/layout/Navbar";
import SearchBar from "../components/ui/SearchBar";
import ProjectCard from "../components/ui/ProjectCard";
import useProjects from "../hooks/useProjects";
// ─── Skeleton loader for project cards ───────────────────────────────────────
const ProjectCardSkeleton = () => (
  <div className="flex flex-col gap-3 p-5 rounded-xl bg-surface border border-border animate-pulse">
    <div className="w-9 h-9 rounded-lg bg-surfaceLight" />
    <div className="flex flex-col gap-2">
      <div className="h-3.5 w-3/4 rounded-full bg-surfaceLight" />
      <div className="h-3 w-full rounded-full bg-surfaceLight" />
      <div className="h-3 w-2/3 rounded-full bg-surfaceLight" />
    </div>
    <div className="flex justify-between mt-auto pt-2 border-t border-border/60">
      <div className="h-3 w-16 rounded-full bg-surfaceLight" />
      <div className="h-3 w-20 rounded-full bg-surfaceLight" />
    </div>
  </div>
);
// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ searchQuery, onCreate }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
    {searchQuery ? (
      <>
        <p className="text-textPrimary font-medium">Tidak ada hasil untuk</p>
        <p className="text-primary font-semibold text-lg">"{searchQuery}"</p>
        <p className="text-textSecondary text-sm">
          Coba kata kunci yang berbeda
        </p>
      </>
    ) : (
      <>
        <p className="text-textPrimary font-medium">Belum ada proyek</p>
        <p className="text-textSecondary text-sm">
          Mulai dengan membuat proyek pertamamu
        </p>
        <button
          onClick={onCreate}
          className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-medium
                     bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors duration-200"
        >
          <HiOutlinePlus className="text-base" />
          Buat Proyek Baru
        </button>
      </>
    )}
  </div>
);
// ─── Home Page ────────────────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const {
    projects,
    searchQuery,
    setSearchQuery,
    isLoading,
    isCreating,
    handleCreate,
  } = useProjects();
  const onCreateNew = async () => {
    try {
      const newProject = await handleCreate();
      navigate(`/chat/${newProject.id}`);
    } catch {
      // toast.error("Gagal membuat proyek"); // uncomment when react-hot-toast is wired
    }
  };
  return (
    <div className="min-h-screen bg-backgroundBlack font-poppins">
      <Navbar />
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center pt-16 pb-10 px-4 animate-fadeIn">
        <h1 className="text-3xl md:text-4xl font-bold text-textPrimary leading-tight">
          Welcome to{" "}
          <span className="bg-linear-to-b from-secondary to-primary bg-clip-text text-transparent">
            Clara.
          </span>
        </h1>
        <p className="mt-3 text-textSecondary text-sm md:text-base">
          Analyze and create legal contracts with AI
        </p>
      </div>
      {/* ── Search + Create ───────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 flex items-center gap-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search projects..."
        />
        <button
          onClick={onCreateNew}
          disabled={isCreating}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                     bg-primary text-white whitespace-nowrap
                     hover:bg-primary/80 active:scale-95
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-lg shadow-primary/30"
        >
          <HiOutlinePlus className="text-base" />
          {isCreating ? "Creating..." : "Create New"}
        </button>
      </div>
      {/* ── Projects Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 mt-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isLoading ? (
            // Skeleton placeholders
            Array.from({ length: 4 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))
          ) : projects.length === 0 ? (
            <EmptyState searchQuery={searchQuery} onCreate={onCreateNew} />
          ) : (
            projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default Home;
