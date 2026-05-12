import { useEffect, useMemo, useState } from "react";
import type { ChatMessage } from "../../../../types/chat";
import type { MockTutorConfig, TutorRequestMode } from "../../../../types/tutor";
import { AiChatLabChatPanel } from "./AiChatLabChatPanel";
import { AiChatLabConfigPanel } from "./AiChatLabConfigPanel";
import { AiChatLabModelCardPanel } from "./AiChatLabModelCardPanel";
import {
  buildAssistantReply,
  createConfigState,
} from "./aiChatLabModel";
import type {
  AiChatConfigTab,
  AiChatLabWorkspaceProps,
  ModelConfigState,
} from "./AiChatLabWorkspace.types";
import styles from "./AiChatLabWorkspace.module.scss";

export function AiChatLabWorkspace(props: AiChatLabWorkspaceProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(props.initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [tutorRequestMode, setTutorRequestMode] =
    useState<TutorRequestMode>("auto");
  const [config, setConfig] = useState<ModelConfigState>(() =>
    createConfigState(props),
  );
  const [retrievalItems, setRetrievalItems] = useState<string[]>([]);
  const [examplePromptItems, setExamplePromptItems] = useState<string[]>([]);
  const [hasUnsavedConfig, setHasUnsavedConfig] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const isShareModeActive = Boolean(props.isShareModeActive);

  const visibleTabs = useMemo<AiChatConfigTab[]>(() => {
    const tabs: AiChatConfigTab[] = [];
    if (props.showSetupTab) tabs.push("setup");
    if (props.showRetrievalTab) tabs.push("retrieval");
    if (props.showPublishTab) tabs.push("publish");
    return tabs;
  }, [props.showPublishTab, props.showRetrievalTab, props.showSetupTab]);

  const [activeConfigTab, setActiveConfigTab] = useState<AiChatConfigTab>(
    visibleTabs[0] ?? "setup",
  );

  useEffect(() => {
    setChatMessages(props.initialMessages);
  }, [props.initialMessages]);

  useEffect(() => {
    setConfig(createConfigState(props));
    setRetrievalItems([]);
    setExamplePromptItems([]);
    setHasUnsavedConfig(false);
    setShowPublishSuccess(false);
  }, [
    props.initialModel,
    props.initialTemperature,
    props.systemPrompt,
    props.retrievalSource,
    props.modelName,
    props.modelIntent,
    props.modelDescription,
    props.modelLimitations,
    props.modelTestingEvaluation,
    props.examplePrompts,
  ]);

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.includes(activeConfigTab)) {
      setActiveConfigTab(visibleTabs[0]);
    }
  }, [activeConfigTab, visibleTabs]);

  const updateConfig = <K extends keyof ModelConfigState>(
    key: K,
    value: ModelConfigState[K],
  ) => {
    setConfig((current) => ({ ...current, [key]: value }));
    setHasUnsavedConfig(true);
    setShowPublishSuccess(false);
  };

  const mockTutorConfig = useMemo<MockTutorConfig>(
    () => ({
      response: (input) => ({
        role: "assistant",
        content: buildAssistantReply(input, config),
      }),
    }),
    [config],
  );

  const clearChat = () => {
    setChatMessages([]);
    setChatInput("");
  };

  const downloadChat = () => {
    if (typeof window === "undefined" || chatMessages.length === 0) return;

    const transcript = chatMessages
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join("\n\n");
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${config.modelName.trim() || "ai-chat"}-transcript.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const resetConfig = () => {
    setConfig(createConfigState(props));
    setRetrievalItems([]);
    setExamplePromptItems([]);
    setHasUnsavedConfig(false);
    setShowPublishSuccess(false);
    props.onShareModeChange?.(false);
  };

  const addRetrievalItem = () => {
    const nextItem = config.retrievalSource.trim();
    if (!nextItem) return;
    setRetrievalItems((current) => [...current, nextItem]);
    updateConfig("retrievalSource", "");
  };

  const addExamplePromptItem = () => {
    const nextItem = config.examplePrompts.trim();
    if (!nextItem) return;
    setExamplePromptItems((current) => [...current, nextItem]);
    updateConfig("examplePrompts", "");
  };

  const saveConfig = () => {
    setHasUnsavedConfig(false);
  };

  const publishModelCard = () => {
    const retrievalDraft = config.retrievalSource.trim();
    const examplePromptDraft = config.examplePrompts.trim();

    if (retrievalDraft) {
      setRetrievalItems((current) => [...current, retrievalDraft]);
    }
    if (examplePromptDraft) {
      setExamplePromptItems((current) => [...current, examplePromptDraft]);
    }
    if (retrievalDraft || examplePromptDraft) {
      setConfig((current) => ({
        ...current,
        retrievalSource: retrievalDraft ? "" : current.retrievalSource,
        examplePrompts: examplePromptDraft ? "" : current.examplePrompts,
      }));
    }

    setHasUnsavedConfig(false);
    setShowPublishSuccess(true);
    props.onShareModeChange?.(true);
  };

  const configStatusText = hasUnsavedConfig
    ? "Remember to save changes"
    : "Configuration is up to date";

  return (
    <main
      className={[
        styles.root,
        isShareModeActive
          ? styles.rootShareMode
          : props.showConfigPanel
            ? styles.rootWithConfig
            : styles.rootChatOnly,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isShareModeActive && (
        <AiChatLabModelCardPanel
          config={config}
          retrievalItems={retrievalItems}
          examplePromptItems={examplePromptItems}
          onConfigView={() => props.onShareModeChange?.(false)}
        />
      )}

      {!isShareModeActive && props.showConfigPanel && (
        <AiChatLabConfigPanel
          visibleTabs={visibleTabs}
          activeConfigTab={activeConfigTab}
          setActiveConfigTab={setActiveConfigTab}
          config={config}
          configStatusText={configStatusText}
          retrievalItems={retrievalItems}
          examplePromptItems={examplePromptItems}
          showPublishSuccess={showPublishSuccess}
          showModelControl={props.showModelControl}
          showTemperatureControl={props.showTemperatureControl}
          showSystemPromptControl={props.showSystemPromptControl}
          showRetrievalSourceControl={props.showRetrievalSourceControl}
          showPublishNameControl={props.showPublishNameControl}
          showPublishDescriptionControl={props.showPublishDescriptionControl}
          showPublishIntentControl={props.showPublishIntentControl}
          showPublishLimitationsControl={props.showPublishLimitationsControl}
          showPublishTestingControl={props.showPublishTestingControl}
          showPublishExamplePromptsControl={props.showPublishExamplePromptsControl}
          onUpdateConfig={updateConfig}
          onResetConfig={resetConfig}
          onShowPublishedView={() => props.onShareModeChange?.(true)}
          onAddRetrievalItem={addRetrievalItem}
          onAddExamplePromptItem={addExamplePromptItem}
          onSaveConfig={saveConfig}
          onPublishModelCard={publishModelCard}
        />
      )}

      <AiChatLabChatPanel
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatPlaceholder={props.chatPlaceholder}
        mockTutorConfig={mockTutorConfig}
        tutorRequestMode={tutorRequestMode}
        setTutorRequestMode={setTutorRequestMode}
        onClearChat={clearChat}
        onDownloadChat={downloadChat}
      />
    </main>
  );
}
