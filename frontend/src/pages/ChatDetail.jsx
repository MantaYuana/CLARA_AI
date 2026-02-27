import { useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ChatDetailTopbar from "../components/chatDetail/ChatDetailTopbar";
import SourcesPanel from "../components/chatDetail/SourcesPanel";
import ChatPanel from "../components/chatDetail/ChatPanel";
import StudioPanel from "../components/chatDetail/StudioPanel";
import useSources from "../hooks/useSources";
import useChat from "../hooks/useChat";

/**
 * ChatDetail — full-page 3-panel layout.
 * URL param: /chat/:id (project id — use to fetch project data when backend is ready)
 */
const ChatDetail = () => {
  const { id } = useParams();

  // ── Hooks ────────────────────────────────────────────────────────────────
  const { sources, selectedCount, processFiles, toggleSelect, removeSource } =
    useSources();
  const { messages, activeMode, setActiveMode, isLoading, sendChatMessage } =
    useChat();

  // Send message — passes selected source IDs and active mode to service
  const handleSend = (message) => {
    const selectedSourceIds = sources
      .filter((s) => s.selected && s.status === "ready")
      .map((s) => s.id);

    sendChatMessage({ message, selectedSourceIds, mode: activeMode });
  };

  return (
    <div className="h-screen flex flex-col bg-backgroundBlack font-poppins overflow-hidden">
      {/* Toaster for react-hot-toast */}
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

      {/* ── Topbar ────────────────────────────────────────────────────────── */}
      {/* TODO: replace "Untitled Project" with fetched project title using `id` */}
      <ChatDetailTopbar projectTitle="Untitled Project" />

      {/* ── 3-panel area ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — Sources */}
        <SourcesPanel
          sources={sources}
          selectedCount={selectedCount}
          onProcessFiles={processFiles}
          onToggleSelect={toggleSelect}
          onRemoveSource={removeSource}
        />

        {/* Center — Chat */}
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSend={handleSend}
          selectedCount={selectedCount}
        />

        {/* Right — Studio / Mode */}
        <StudioPanel activeMode={activeMode} onSetMode={setActiveMode} />
      </div>
    </div>
  );
};

export default ChatDetail;
