import ProjectCard from "../ui/ProjectCard";
import ProjectCardSkeleton from "./ProjectCardSkeleton";
import EmptyState from "./EmptyState";

const ProjectsGrid = ({ projects, isLoading, searchQuery, onCreate }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 mt-8 pb-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))
        ) : projects.length === 0 ? (
          <EmptyState searchQuery={searchQuery} onCreate={onCreate} />
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectsGrid;
