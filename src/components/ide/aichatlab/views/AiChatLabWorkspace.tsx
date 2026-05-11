import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { AppButton } from "../../../ui/AppButton";
import { AppSlider } from "../../../ui/AppSlider";
import { AppTextArea, AppTextField } from "../../../ui/AppTextField";
import { PanelHeader } from "../../../ui/PanelHeader";
import { ScrollArea } from "../../../ui/scroll-area";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { AiTutorPanel } from "../../../lab2/resource-panel/views/ai-tutor/AiTutorPanel";
import type { ChatMessage } from "../../../../types/chat";
import type { MockTutorConfig, TutorRequestMode } from "../../../../types/tutor";
import styles from "./AiChatLabWorkspace.module.scss";

type AiChatConfigTab = "setup" | "retrieval" | "publish";

export interface AiChatLabWorkspaceProps {
  showConfigPanel: boolean;
  showSetupTab: boolean;
  showRetrievalTab: boolean;
  showPublishTab: boolean;
  showTemperatureControl: boolean;
  showSystemPromptControl: boolean;
  showRetrievalSourceControl: boolean;
  showPublishNameControl: boolean;
  showPublishIntentControl: boolean;
  showPublishDescriptionControl: boolean;
  showPublishLimitationsControl: boolean;
  showPublishExamplePromptsControl: boolean;
  initialTemperature: number;
  systemPrompt: string;
  retrievalSource: string;
  modelName: string;
  modelIntent: string;
  modelDescription: string;
  modelLimitations: string;
  examplePrompts: string;
  initialMessages: ChatMessage[];
  chatPlaceholder: string;
}

interface ModelConfigState {
  temperature: number;
  systemPrompt: string;
  retrievalSource: string;
  modelName: string;
  modelIntent: string;
  modelDescription: string;
  modelLimitations: string;
  examplePrompts: string;
}

const TAB_LABELS: Record<AiChatConfigTab, string> = {
  setup: "Setup",
  retrieval: "Retrieval",
  publish: "Publish",
};

function clampTemperature(value: number) {
  return Math.max(0, Math.min(1, value));
}

function createConfigState(props: AiChatLabWorkspaceProps): ModelConfigState {
  return {
    temperature: clampTemperature(props.initialTemperature),
    systemPrompt: props.systemPrompt,
    retrievalSource: props.retrievalSource,
    modelName: props.modelName,
    modelIntent: props.modelIntent,
    modelDescription: props.modelDescription,
    modelLimitations: props.modelLimitations,
    examplePrompts: props.examplePrompts,
  };
}

function buildAssistantReply(input: string, config: ModelConfigState) {
  const trimmedPrompt = input.trim();
  const creativity =
    config.temperature < 0.35
      ? "I'll keep this focused and predictable."
      : config.temperature > 0.75
        ? "I'll explore a few creative angles."
        : "I'll balance clarity with a little flexibility.";
  const systemHint = config.systemPrompt.trim()
    ? ` System note: ${config.systemPrompt.trim()}`
    : "";
  const retrievalHint = config.retrievalSource.trim()
    ? ` I also checked the retrieval notes before answering.`
    : "";
  const intentHint = config.modelIntent.trim()
    ? ` This response is tuned for ${config.modelIntent.trim().toLowerCase()}.`
    : "";

  return [
    `${creativity} You asked: "${trimmedPrompt}".`,
    `${retrievalHint}${intentHint}${systemHint}`.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function ConfigField({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const labelId = useId();

  return (
    <div
      className={styles.field}
      role={label ? "group" : undefined}
      aria-labelledby={label ? labelId : undefined}
    >
      {label ? (
        <span id={labelId} className={styles.fieldLabel}>
          {label}
        </span>
      ) : null}
      {children}
    </div>
  );
}

export function AiChatLabWorkspace(props: AiChatLabWorkspaceProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(props.initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [tutorRequestMode, setTutorRequestMode] =
    useState<TutorRequestMode>("auto");
  const [config, setConfig] = useState<ModelConfigState>(() =>
    createConfigState(props),
  );
  const [hasUnsavedConfig, setHasUnsavedConfig] = useState(false);

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
    setHasUnsavedConfig(false);
  }, [
    props.initialTemperature,
    props.systemPrompt,
    props.retrievalSource,
    props.modelName,
    props.modelIntent,
    props.modelDescription,
    props.modelLimitations,
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

  const resetConfig = () => {
    setConfig(createConfigState(props));
    setHasUnsavedConfig(false);
  };

  return (
    <main
      className={[
        styles.root,
        props.showConfigPanel ? styles.rootWithConfig : styles.rootChatOnly,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {props.showConfigPanel && (
        <section className={styles.configPanel}>
          <PanelHeader
            label="MODEL CUSTOMIZATION"
            right={
              <AppButton
                variant="tertiary"
                tone="gray"
                size="xs"
                iconName="rotate-left"
                onClick={resetConfig}
                aria-label="Reset model configuration"
              />
            }
          />
          {visibleTabs.length > 0 ? (
            <>
              <div className={styles.tabBar} role="tablist" aria-label="Model configuration tabs">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeConfigTab === tab}
                    className={[
                      styles.tabButton,
                      activeConfigTab === tab ? styles.tabButtonActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setActiveConfigTab(tab)}
                  >
                    {TAB_LABELS[tab]}
                  </button>
                ))}
              </div>

              <ScrollArea className={styles.configBody} viewportClassName={styles.configViewport}>
                <div className={styles.configInner}>
                  {activeConfigTab === "setup" && (
                    <div className={styles.fieldStack}>
                      {props.showTemperatureControl && (
                        <ConfigField>
                          <AppSlider
                            value={config.temperature}
                            min={0}
                            max={1}
                            step={0.1}
                            label="Temperature"
                            valueLabel={config.temperature.toFixed(1)}
                            showInputValue
                            showStepper
                            stepperLabels={["0", "", "", "", "", "", "", "", "", "", "1"]}
                            showControlButtons
                            formatValue={(value) => value.toFixed(1)}
                            decrementAriaLabel="Lower temperature"
                            incrementAriaLabel="Raise temperature"
                            onValueChange={(value) => updateConfig("temperature", value)}
                          />
                        </ConfigField>
                      )}
                      {props.showSystemPromptControl && (
                        <ConfigField>
                          <AppTextArea
                            label="System Prompt"
                            value={config.systemPrompt}
                            onChange={(event) =>
                              updateConfig("systemPrompt", event.target.value)
                            }
                            rows={8}
                            size="s"
                            tone="gray"
                          />
                        </ConfigField>
                      )}
                    </div>
                  )}

                  {activeConfigTab === "retrieval" && (
                    <div className={styles.fieldStack}>
                      {props.showRetrievalSourceControl ? (
                        <ConfigField>
                          <AppTextArea
                            label="Retrieval Notes"
                            value={config.retrievalSource}
                            onChange={(event) =>
                              updateConfig("retrievalSource", event.target.value)
                            }
                            rows={12}
                            size="s"
                            tone="gray"
                          />
                        </ConfigField>
                      ) : (
                        <div className={styles.emptyConfig}>
                          <FaIcon name="database" size="l" className={styles.emptyIcon} />
                          <p className={styles.emptyTitle}>Retrieval is hidden</p>
                          <p className={styles.emptyBody}>
                            Turn on retrieval fields in the dev panel to add model context.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeConfigTab === "publish" && (
                    <div className={styles.fieldStack}>
                      {props.showPublishNameControl && (
                        <ConfigField>
                          <AppTextField
                            label="Name"
                            value={config.modelName}
                            onChange={(event) =>
                              updateConfig("modelName", event.target.value)
                            }
                            size="s"
                            tone="gray"
                          />
                        </ConfigField>
                      )}
                      {props.showPublishIntentControl && (
                        <ConfigField>
                          <AppTextField
                            label="Intent"
                            value={config.modelIntent}
                            onChange={(event) =>
                              updateConfig("modelIntent", event.target.value)
                            }
                            size="s"
                            tone="gray"
                          />
                        </ConfigField>
                      )}
                      {props.showPublishDescriptionControl && (
                        <ConfigField>
                          <AppTextArea
                            label="Description"
                            value={config.modelDescription}
                            onChange={(event) =>
                              updateConfig("modelDescription", event.target.value)
                            }
                            rows={5}
                            size="s"
                            tone="gray"
                          />
                        </ConfigField>
                      )}
                      {props.showPublishLimitationsControl && (
                        <ConfigField>
                          <AppTextArea
                            label="Limitations"
                            value={config.modelLimitations}
                            onChange={(event) =>
                              updateConfig("modelLimitations", event.target.value)
                            }
                            rows={5}
                            size="s"
                            tone="gray"
                          />
                        </ConfigField>
                      )}
                      {props.showPublishExamplePromptsControl && (
                        <ConfigField>
                          <AppTextArea
                            label="Example Prompts"
                            value={config.examplePrompts}
                            onChange={(event) =>
                              updateConfig("examplePrompts", event.target.value)
                            }
                            rows={6}
                            size="s"
                            tone="gray"
                          />
                        </ConfigField>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className={styles.configFooter}>
                <AppButton
                  variant="primary"
                  tone="purple"
                  size="s"
                  fullWidth
                  iconName="floppy-disk"
                  onClick={() => setHasUnsavedConfig(false)}
                >
                  Update
                </AppButton>
                <p className={styles.configStatus}>
                  {hasUnsavedConfig ? "You have unsaved changes" : "Configuration is up to date"}
                </p>
              </div>
            </>
          ) : (
            <div className={styles.emptyConfig}>
              <FaIcon name="sliders" size="l" className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No configuration tabs</p>
              <p className={styles.emptyBody}>
                Enable setup, retrieval, or publish tabs in the dev panel.
              </p>
            </div>
          )}
        </section>
      )}

      <section className={styles.chatPanel}>
        <PanelHeader
          label="AI CHAT"
          right={
            <AppButton
              variant="tertiary"
              tone="gray"
              size="xs"
              iconName="rotate"
              onClick={clearChat}
              disabled={chatMessages.length === 0 && chatInput.length === 0}
              aria-label="Clear AI chat"
            />
          }
        />
        <AiTutorPanel
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          showInstructionsDrawer={false}
          inputExperiment="default"
          mockTutorConfig={mockTutorConfig}
          showModelSelector={false}
          composerPlaceholder={props.chatPlaceholder}
          emptyStateTitle="Start a conversation"
          emptyStateText="Try a prompt, then tweak the model settings and compare the response."
          tutorRequestMode={tutorRequestMode}
          setTutorRequestMode={setTutorRequestMode}
        />
      </section>
    </main>
  );
}
