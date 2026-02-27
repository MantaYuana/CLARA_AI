import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ChatDetailTopbar from "../components/chatDetail/ChatDetailTopbar";
import SourcesPanel from "../components/chatDetail/SourcesPanel";
import ChatPanel from "../components/chatDetail/ChatPanel";
import StudioPanel from "../components/chatDetail/StudioPanel";
import useSources from "../hooks/useSources";
import useChat from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import useProjects from "../hooks/useProjects";

const TABS = ["Sources", "Chat", "Studio"];

/**
 * ChatDetail — full-page 3-panel layout with mobile tab navigation.
 * URL param: /chat/:id  — use to fetch project data when backend is ready
 */
const ChatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mobileTab, setMobileTab] = useState("Chat");
  const { user, loading, logout } = useAuth();
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const hasGeneratedTitle = useRef(false);
  const { sources, selectedCount, processFiles, toggleSelect, removeSource } =
    useSources();
  const {
    messages,
    activeMode,
    setActiveMode,
    isLoading,
    sendChatMessage,
    queryOnly,
  } = useChat();

  const { handleCreate } = useProjects();

  const handleCreateNewChat = async () => {
    try {
      const newProject = await handleCreate();
      navigate(`/chat/${newProject.id}`);
    } catch {}
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (messages.length <= 1) return; // hanya init message
    if (hasGeneratedTitle.current) return;

    const firstUserMessage = messages.find((m) => m.role === "user");
    if (!firstUserMessage) return;

    hasGeneratedTitle.current = true;

    const generateTitle = async () => {
      try {
        const response = await queryOnly({
          message: `Berikan judul singkat (maksimal 5 kata) dari pertanyaan berikut:\n\n"${firstUserMessage.content}"`,
        });

        if (response?.content) {
          setProjectTitle(response.content.trim());
        }
      } catch (err) {
        console.error("Failed to generate title", err);
      }
    };

    generateTitle();
  }, [messages]);

  const handleSend = (message) => {
    const selectedSources = sources.filter(
      (s) => s.selected && s.status === "ready",
    );

    const selectedFile =
      selectedSources.length > 0 ? selectedSources[0].file : null;

    const selectedSourceIds = selectedSources
      .filter((s) => s.documentId)
      .map((s) => s.documentId);

    sendChatMessage({
      message,
      selectedSourceIds,
      selectedFile,
      mode: activeMode,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-backgroundBlack font-poppins overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1721",
            color: "#f0edf5",
            border: "1px solid #3a3444",
          },
        }}
      />

      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <ChatDetailTopbar
        projectTitle={projectTitle}
        user={user}
        onLogout={logout}
        onCreateNew={handleCreateNewChat}
      />

      {/* ── Mobile tab bar (hidden on lg+) ──────────────────────────────────── */}
      <div className="flex lg:hidden border-b border-gray-200 dark:border-border bg-white dark:bg-backgroundBlack px-4 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors duration-150
                        ${
                          mobileTab === tab
                            ? "text-primary border-b-2 border-primary"
                            : "text-gray-500 dark:text-textSecondary hover:text-gray-800 dark:hover:text-textPrimary"
                        }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── 3-panel area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-3 py-3 px-3 md:px-4 lg:px-8 pb-4 overflow-hidden min-h-0">
        {/* Left — Sources */}
        <div
          className={`lg:flex flex-col shrink-0 min-h-0 ${
            mobileTab === "Sources" ? "flex" : "hidden"
          } w-full lg:w-auto`}
        >
          <SourcesPanel
            sources={sources}
            selectedCount={selectedCount}
            onProcessFiles={processFiles}
            onToggleSelect={toggleSelect}
            onRemoveSource={removeSource}
            activeMode={activeMode}
            fullWidth={false}
          />
        </div>

        {/* Center — Chat */}
        <div
          className={`lg:flex flex-1 flex-col min-w-0 min-h-0 ${
            mobileTab === "Chat" ? "flex" : "hidden"
          }`}
        >
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
            selectedCount={selectedCount}
            user={user}
            activeMode={activeMode}
          />
        </div>

        {/* Right — Studio */}
        <div
          className={`lg:flex flex-col shrink-0 min-h-0 ${
            mobileTab === "Studio" ? "flex" : "hidden"
          } w-full lg:w-auto`}
        >
          <StudioPanel activeMode={activeMode} onSetMode={setActiveMode} />
        </div>
      </div>
    </div>
  );
};

export default ChatDetail;
