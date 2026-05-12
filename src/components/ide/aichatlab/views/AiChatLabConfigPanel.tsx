import {
  useId,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { AlertBanner } from "../../../ui/AlertBanner";
import { AppButton } from "../../../ui/AppButton";
import { AppNativeSelect } from "../../../ui/AppDropdown";
import { AppSlider } from "../../../ui/AppSlider";
import { AppTextArea, AppTextField } from "../../../ui/AppTextField";
import { PanelHeader } from "../../../ui/PanelHeader";
import { Tooltip } from "../../../ui/Tooltip";
import { ScrollArea } from "../../../ui/scroll-area";
import { FaIcon } from "../../../ui/icons/FaIcon";
import type {
  AiChatConfigTab,
  ModelConfigState,
} from "./AiChatLabWorkspace.types";
import { MODEL_OPTIONS, TAB_LABELS } from "./aiChatLabModel";
import styles from "./AiChatLabWorkspace.module.scss";

interface AiChatLabConfigPanelProps {
  visibleTabs: AiChatConfigTab[];
  activeConfigTab: AiChatConfigTab;
  setActiveConfigTab: Dispatch<SetStateAction<AiChatConfigTab>>;
  config: ModelConfigState;
  configStatusText: string;
  retrievalItems: string[];
  examplePromptItems: string[];
  showPublishSuccess: boolean;
  showModelControl: boolean;
  showTemperatureControl: boolean;
  showSystemPromptControl: boolean;
  showRetrievalSourceControl: boolean;
  showPublishNameControl: boolean;
  showPublishDescriptionControl: boolean;
  showPublishIntentControl: boolean;
  showPublishLimitationsControl: boolean;
  showPublishTestingControl: boolean;
  showPublishExamplePromptsControl: boolean;
  onUpdateConfig: <K extends keyof ModelConfigState>(
    key: K,
    value: ModelConfigState[K],
  ) => void;
  onResetConfig: () => void;
  onShowPublishedView: () => void;
  onAddRetrievalItem: () => void;
  onAddExamplePromptItem: () => void;
  onSaveConfig: () => void;
  onPublishModelCard: () => void;
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

function AddedItemsSection({
  emptyText,
  items,
  title,
}: {
  emptyText: string;
  items: string[];
  title: string;
}) {
  return (
    <section className={styles.addedSection}>
      <div className={styles.addedHeader}>
        <p className={styles.addedTitle}>{title}</p>
        <span className={styles.addedCount}>{items.length}</span>
      </div>
      {items.length > 0 ? (
        <div className={styles.addedList}>
          {items.map((item, index) => (
            <article key={`${item}-${index}`} className={styles.addedCard}>
              <p className={styles.addedCardText}>{item}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.emptyAdded}>{emptyText}</p>
      )}
    </section>
  );
}

export function AiChatLabConfigPanel({
  visibleTabs,
  activeConfigTab,
  setActiveConfigTab,
  config,
  configStatusText,
  retrievalItems,
  examplePromptItems,
  showPublishSuccess,
  showModelControl,
  showTemperatureControl,
  showSystemPromptControl,
  showRetrievalSourceControl,
  showPublishNameControl,
  showPublishDescriptionControl,
  showPublishIntentControl,
  showPublishLimitationsControl,
  showPublishTestingControl,
  showPublishExamplePromptsControl,
  onUpdateConfig,
  onResetConfig,
  onShowPublishedView,
  onAddRetrievalItem,
  onAddExamplePromptItem,
  onSaveConfig,
  onPublishModelCard,
}: AiChatLabConfigPanelProps) {
  return (
    <section className={styles.configPanel}>
      <PanelHeader
        label="MODEL CUSTOMIZATION"
        right={
          <div className={styles.headerActions}>
            <Tooltip content="Start over" position="bottom">
              <AppButton
                variant="tertiary"
                tone="gray"
                size="xs"
                iconName="arrow-rotate-left"
                onClick={onResetConfig}
                aria-label="Start over"
              />
            </Tooltip>
            {showPublishSuccess && (
              <AppButton
                variant="secondary"
                tone="gray"
                size="xs"
                iconName="share-nodes"
                onClick={onShowPublishedView}
              >
                Published view
              </AppButton>
            )}
          </div>
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
                  {showModelControl && (
                    <ConfigField label="Model">
                      <AppNativeSelect
                        value={config.modelId}
                        options={MODEL_OPTIONS}
                        onValueChange={(value) => onUpdateConfig("modelId", value)}
                        size="s"
                        tone="gray"
                        fullWidth
                        aria-label="Choose model"
                      />
                    </ConfigField>
                  )}
                  {showTemperatureControl && (
                    <ConfigField>
                      <AppSlider
                        value={config.temperature}
                        min={0}
                        max={1}
                        step={0.1}
                        size="s"
                        label="Temperature"
                        valueLabel={config.temperature.toFixed(1)}
                        showInputValue
                        showControlButtons
                        formatValue={(value) => value.toFixed(1)}
                        decrementAriaLabel="Lower temperature"
                        incrementAriaLabel="Raise temperature"
                        onValueChange={(value) => onUpdateConfig("temperature", value)}
                      />
                    </ConfigField>
                  )}
                  {showSystemPromptControl && (
                    <ConfigField>
                      <AppTextArea
                        label="System Prompt"
                        value={config.systemPrompt}
                        onChange={(event) =>
                          onUpdateConfig("systemPrompt", event.target.value)
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
                  {showRetrievalSourceControl ? (
                    <>
                      <ConfigField>
                        <AppTextArea
                          label="Retrieval Notes"
                          value={config.retrievalSource}
                          onChange={(event) =>
                            onUpdateConfig("retrievalSource", event.target.value)
                          }
                          rows={8}
                          size="s"
                          tone="gray"
                        />
                      </ConfigField>
                      <AppButton
                        variant="secondary"
                        tone="gray"
                        size="s"
                        iconName="plus"
                        onClick={onAddRetrievalItem}
                        disabled={!config.retrievalSource.trim()}
                      >
                        Add retrieval note
                      </AppButton>
                      <AddedItemsSection
                        title="Added retrieval"
                        items={retrievalItems}
                        emptyText="Added retrieval notes will appear here."
                      />
                    </>
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
                  {showPublishNameControl && (
                    <ConfigField>
                      <AppTextField
                        label="Name"
                        value={config.modelName}
                        onChange={(event) =>
                          onUpdateConfig("modelName", event.target.value)
                        }
                        size="s"
                        tone="gray"
                      />
                    </ConfigField>
                  )}
                  {showPublishDescriptionControl && (
                    <ConfigField>
                      <AppTextArea
                        label="Description"
                        value={config.modelDescription}
                        onChange={(event) =>
                          onUpdateConfig("modelDescription", event.target.value)
                        }
                        rows={5}
                        size="s"
                        tone="gray"
                      />
                    </ConfigField>
                  )}
                  {showPublishIntentControl && (
                    <ConfigField>
                      <AppTextArea
                        label="Intended Use"
                        value={config.modelIntent}
                        onChange={(event) =>
                          onUpdateConfig("modelIntent", event.target.value)
                        }
                        rows={4}
                        size="s"
                        tone="gray"
                      />
                    </ConfigField>
                  )}
                  {showPublishLimitationsControl && (
                    <ConfigField>
                      <AppTextArea
                        label="Limitations and Warnings"
                        value={config.modelLimitations}
                        onChange={(event) =>
                          onUpdateConfig("modelLimitations", event.target.value)
                        }
                        rows={5}
                        size="s"
                        tone="gray"
                      />
                    </ConfigField>
                  )}
                  {showPublishTestingControl && (
                    <ConfigField>
                      <AppTextArea
                        label="Testing and Evaluation"
                        value={config.modelTestingEvaluation}
                        onChange={(event) =>
                          onUpdateConfig("modelTestingEvaluation", event.target.value)
                        }
                        rows={5}
                        size="s"
                        tone="gray"
                      />
                    </ConfigField>
                  )}
                  {showPublishExamplePromptsControl && (
                    <>
                      <ConfigField>
                        <AppTextArea
                          label="Example Prompts and Topics"
                          value={config.examplePrompts}
                          onChange={(event) =>
                            onUpdateConfig("examplePrompts", event.target.value)
                          }
                          rows={5}
                          size="s"
                          tone="gray"
                        />
                      </ConfigField>
                      <AppButton
                        variant="secondary"
                        tone="gray"
                        size="s"
                        iconName="plus"
                        onClick={onAddExamplePromptItem}
                        disabled={!config.examplePrompts.trim()}
                      >
                        Add example prompt
                      </AppButton>
                      <AddedItemsSection
                        title="Added example prompts"
                        items={examplePromptItems}
                        emptyText="Added example prompts will appear here."
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className={styles.configFooter}>
            <p className={styles.configStatus}>
              {configStatusText}
            </p>
            {activeConfigTab === "publish" ? (
              <>
                {showPublishSuccess && (
                  <AlertBanner
                    className={styles.publishToast}
                    dismissible={false}
                    presentation="toast"
                    sentiment="success"
                    showIcon
                    size="xs"
                  >
                    Model card published.
                  </AlertBanner>
                )}
                <div className={styles.footerButtonRow}>
                  <AppButton
                    variant="secondary"
                    tone="gray"
                    size="s"
                    fullWidth
                    iconName="floppy-disk"
                    onClick={onSaveConfig}
                  >
                    Save
                  </AppButton>
                  <AppButton
                    variant="primary"
                    tone="purple"
                    size="s"
                    fullWidth
                    iconName="share-nodes"
                    onClick={onPublishModelCard}
                  >
                    Publish
                  </AppButton>
                </div>
              </>
            ) : (
              <AppButton
                variant="primary"
                tone="purple"
                size="s"
                fullWidth
                iconName="floppy-disk"
                onClick={onSaveConfig}
              >
                Update
              </AppButton>
            )}
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
  );
}
