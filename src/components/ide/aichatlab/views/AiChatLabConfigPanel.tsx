import {
  useId,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  Alert,
  Button,
  Dropdown,
  Slider,
  Tabs,
  TextInput,
  Tooltip,
} from "@moshebaricdo/cads-react";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import { PanelHeader } from "../../../ui/PanelHeader";
import { ScrollArea } from "../../../ui/scroll-area";
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
            <Tooltip title="Start over" placement="bottom">
              <span>
                <Button
                  variant="text"
                  color="tertiary"
                  size="extraSmall"
                  iconOnly
                  startIconName="arrow-rotate-left"
                  onClick={onResetConfig}
                  aria-label="Start over"
                />
              </span>
            </Tooltip>
            {showPublishSuccess && (
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                startIconName="share-nodes"
                onClick={onShowPublishedView}
              >
                Published view
              </Button>
            )}
          </div>
        }
      />
      {visibleTabs.length > 0 ? (
        <>
          <div className={styles.tabBar}>
            <Tabs
              type="secondary"
              size="medium"
              aria-label="Model configuration tabs"
              value={activeConfigTab}
              onChange={(value) =>
                setActiveConfigTab(value as AiChatConfigTab)
              }
              items={visibleTabs.map((tab) => ({
                value: tab,
                label: TAB_LABELS[tab],
              }))}
            />
          </div>

          <ScrollArea
            className={styles.configBody}
            viewportClassName={styles.configViewport}
          >
            <div className={styles.configInner}>
              {activeConfigTab === "setup" && (
                <div className={styles.fieldStack}>
                  {showModelControl && (
                    <ConfigField label="Model">
                      <Dropdown
                        role="input"
                        size="small"
                        color="secondary"
                        width="full"
                        value={config.modelId}
                        options={MODEL_OPTIONS}
                        onChange={(value) =>
                          onUpdateConfig(
                            "modelId",
                            Array.isArray(value) ? value[0] ?? "" : value,
                          )
                        }
                        aria-label="Choose model"
                      />
                    </ConfigField>
                  )}
                  {showTemperatureControl && (
                    <ConfigField>
                      <Slider
                        value={config.temperature}
                        min={0}
                        max={1}
                        step={0.1}
                        size="small"
                        label="Temperature"
                        displayValue={config.temperature.toFixed(1)}
                        showControls
                        fullWidth
                        onChange={(_event, value) => {
                          const next = Array.isArray(value) ? value[0] : value;
                          onUpdateConfig("temperature", next);
                        }}
                        aria-label="Temperature"
                      />
                    </ConfigField>
                  )}
                  {showSystemPromptControl && (
                    <ConfigField>
                      <TextInput
                        label="System Prompt"
                        value={config.systemPrompt}
                        onChange={(event) =>
                          onUpdateConfig("systemPrompt", event.target.value)
                        }
                        multiline
                        rows={8}
                        size="small"
                        color="secondary"
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
                        <TextInput
                          label="Retrieval Notes"
                          value={config.retrievalSource}
                          onChange={(event) =>
                            onUpdateConfig(
                              "retrievalSource",
                              event.target.value,
                            )
                          }
                          multiline
                          rows={8}
                          size="small"
                          color="secondary"
                        />
                      </ConfigField>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        startIconName="plus"
                        onClick={onAddRetrievalItem}
                        disabled={!config.retrievalSource.trim()}
                      >
                        Add retrieval note
                      </Button>
                      <AddedItemsSection
                        title="Added retrieval"
                        items={retrievalItems}
                        emptyText="Added retrieval notes will appear here."
                      />
                    </>
                  ) : (
                    <div className={styles.emptyConfig}>
                      <FaIcon
                        name="database"
                        size="large"
                        className={styles.emptyIcon}
                      />
                      <p className={styles.emptyTitle}>Retrieval is hidden</p>
                      <p className={styles.emptyBody}>
                        Turn on retrieval fields in the dev panel to add model
                        context.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeConfigTab === "publish" && (
                <div className={styles.fieldStack}>
                  {showPublishNameControl && (
                    <ConfigField>
                      <TextInput
                        label="Name"
                        value={config.modelName}
                        onChange={(event) =>
                          onUpdateConfig("modelName", event.target.value)
                        }
                        size="small"
                        color="secondary"
                      />
                    </ConfigField>
                  )}
                  {showPublishDescriptionControl && (
                    <ConfigField>
                      <TextInput
                        label="Description"
                        value={config.modelDescription}
                        onChange={(event) =>
                          onUpdateConfig(
                            "modelDescription",
                            event.target.value,
                          )
                        }
                        multiline
                        rows={5}
                        size="small"
                        color="secondary"
                      />
                    </ConfigField>
                  )}
                  {showPublishIntentControl && (
                    <ConfigField>
                      <TextInput
                        label="Intended Use"
                        value={config.modelIntent}
                        onChange={(event) =>
                          onUpdateConfig("modelIntent", event.target.value)
                        }
                        multiline
                        rows={4}
                        size="small"
                        color="secondary"
                      />
                    </ConfigField>
                  )}
                  {showPublishLimitationsControl && (
                    <ConfigField>
                      <TextInput
                        label="Limitations and Warnings"
                        value={config.modelLimitations}
                        onChange={(event) =>
                          onUpdateConfig(
                            "modelLimitations",
                            event.target.value,
                          )
                        }
                        multiline
                        rows={5}
                        size="small"
                        color="secondary"
                      />
                    </ConfigField>
                  )}
                  {showPublishTestingControl && (
                    <ConfigField>
                      <TextInput
                        label="Testing and Evaluation"
                        value={config.modelTestingEvaluation}
                        onChange={(event) =>
                          onUpdateConfig(
                            "modelTestingEvaluation",
                            event.target.value,
                          )
                        }
                        multiline
                        rows={5}
                        size="small"
                        color="secondary"
                      />
                    </ConfigField>
                  )}
                  {showPublishExamplePromptsControl && (
                    <>
                      <ConfigField>
                        <TextInput
                          label="Example Prompts and Topics"
                          value={config.examplePrompts}
                          onChange={(event) =>
                            onUpdateConfig(
                              "examplePrompts",
                              event.target.value,
                            )
                          }
                          multiline
                          rows={5}
                          size="small"
                          color="secondary"
                        />
                      </ConfigField>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        startIconName="plus"
                        onClick={onAddExamplePromptItem}
                        disabled={!config.examplePrompts.trim()}
                      >
                        Add example prompt
                      </Button>
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
            <p className={styles.configStatus}>{configStatusText}</p>
            {activeConfigTab === "publish" ? (
              <>
                {showPublishSuccess && (
                  <Alert
                    className={styles.publishToast}
                    isDismissible={false}
                    sentiment="success"
                    size="extraSmall"
                  >
                    Model card published.
                  </Alert>
                )}
                <div className={styles.footerButtonRow}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    fullWidth
                    startIconName="floppy-disk"
                    onClick={onSaveConfig}
                  >
                    Save
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    fullWidth
                    startIconName="share-nodes"
                    onClick={onPublishModelCard}
                  >
                    Publish
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                size="small"
                fullWidth
                startIconName="floppy-disk"
                onClick={onSaveConfig}
              >
                Update
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className={styles.emptyConfig}>
          <FaIcon
            name="sliders"
            size="large"
            className={styles.emptyIcon}
          />
          <p className={styles.emptyTitle}>No configuration tabs</p>
          <p className={styles.emptyBody}>
            Enable setup, retrieval, or publish tabs in the dev panel.
          </p>
        </div>
      )}
    </section>
  );
}
