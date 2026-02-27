import { useState, useEffect, useMemo } from "react";
import {
  fetchProjects,
  createProject,
  renameProject,
  deleteProject,
} from "../Services/projectService";

/**
 * Custom hook to manage project list state, search, creation, rename, and deletion.
 */
const useProjects = () => {
  const [allProjects, setAllProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchProjects();
        setAllProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Client-side search ──────────────────────────────────────────────────────
  const projects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allProjects;
    return allProjects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [allProjects, searchQuery]);

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (payload = {}) => {
    try {
      setIsCreating(true);
      const newProject = await createProject(payload);
      setAllProjects((prev) => [newProject, ...prev]);
      return newProject;
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // ── Rename ──────────────────────────────────────────────────────────────────
  const handleRename = async (id, newTitle) => {
    // Optimistic update
    setAllProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title: newTitle } : p)),
    );
    try {
      await renameProject(id, newTitle);
    } catch (error) {
      console.error("Failed to rename project:", error);
      // TODO: revert optimistic update on failure
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    // Optimistic update
    setAllProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteProject(id);
    } catch (error) {
      console.error("Failed to delete project:", error);
      // TODO: revert optimistic update on failure
    }
  };

  return {
    projects,
    allProjects,
    searchQuery,
    setSearchQuery,
    isLoading,
    isCreating,
    handleCreate,
    handleRename,
    handleDelete,
  };
};

export default useProjects;
