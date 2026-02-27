import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ChatDetailTopbar from "../components/chatDetail/ChatDetailTopbar";
import SourcesPanel from "../components/chatDetail/SourcesPanel";
import ChatPanel from "../components/chatDetail/ChatPanel";
import StudioPanel from "../components/chatDetail/StudioPanel";
import useSources from "../hooks/useSources";
import useChat from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";

const TABS = ["Sources", "Chat", "Studio"];

/**
 * ChatDetail — full-page 3-panel layout with mobile tab navigation.
 * URL param: /chat/:id  — use to fetch project data when backend is ready
 */
const ChatDetail = () => {
  const { id } = useParams();
  const [mobileTab, setMobileTab] = useState("Chat");
  const { user, loading } = useAuth();

  const { sources, selectedCount, processFiles, toggleSelect, removeSource } =
    useSources();
  const { messages, activeMode, setActiveMode, isLoading, sendChatMessage } =
    useChat();

  const handleSend = (message) => {
    const selectedSources = sources.filter(
      (s) => s.selected && s.status === "ready",
    );

    // For review mode — pass the actual File object (endpoint requires the file directly)
    const selectedFile =
      selectedSources.length > 0 ? selectedSources[0].file : null;

    // For query mode — pass real documentIds from analyze response
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
    <div className="h-screen flex flex-col dark:bg-backgroundBlack font-poppins overflow-hidden">
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
      {/* TODO: replace "Untitled Project" with fetched project title using `id` */}
      <ChatDetailTopbar projectTitle="Untitled Project" user={user} />

      {/* ── Mobile tab bar (hidden on lg+) ───────────────────────────────── */}
      <div className="flex lg:hidden border-b border-border bg-backgroundBlack px-4 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors duration-150
                        ${
                          mobileTab === tab
                            ? "text-primary border-b-2 border-primary"
                            : "text-textSecondary hover:text-textPrimary"
                        }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── 3-panel area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-4 py-4 px-10 pb-4 overflow-hidden">
        {/* Left — Sources */}
        {/* Desktop: fixed width, collapsible | Mobile: hidden/shown via tab, full width */}
        <div
          className={`lg:flex flex-col shrink-0 ${mobileTab === "Sources" ? "flex" : "hidden"} w-full lg:w-auto`}
        >
          <SourcesPanel
            sources={sources}
            selectedCount={selectedCount}
            onProcessFiles={processFiles}
            onToggleSelect={toggleSelect}
            onRemoveSource={removeSource}
            fullWidth={false} // force full-width mode on mobile is handled via CSS above
          />
        </div>

        {/* Center — Chat */}
        <div
          className={`lg:flex flex-1 flex-col min-w-0 ${mobileTab === "Chat" ? "flex" : "hidden"}`}
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
          className={`lg:flex flex-col shrink-0 ${mobileTab === "Studio" ? "flex" : "hidden"} w-full lg:w-auto`}
        >
          <StudioPanel activeMode={activeMode} onSetMode={setActiveMode} />
        </div>
      </div>
    </div>
  );
};

export default ChatDetail;
