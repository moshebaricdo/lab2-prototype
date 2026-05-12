import {
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AppButton } from "../../../ui/AppButton";
import { PanelHeader } from "../../../ui/PanelHeader";
import { ScrollArea } from "../../../ui/scroll-area";
import { FaIcon, type FaIconProps } from "../../../ui/icons/FaIcon";
import type { ModelConfigState } from "./AiChatLabWorkspace.types";
import { getModelLabel } from "./aiChatLabModel";
import styles from "./AiChatLabWorkspace.module.scss";

interface AiChatLabModelCardPanelProps {
  config: ModelConfigState;
  retrievalItems: string[];
  examplePromptItems: string[];
  onConfigView: () => void;
}

function ModelCardField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className={styles.modelCardField}>
      <dt>{label}</dt>
      <dd>{value || "Not provided"}</dd>
    </div>
  );
}

function ModelCardSection({
  children,
  iconName,
  title,
}: {
  children: ReactNode;
  iconName: FaIconProps["name"];
  title: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded((current) => !current);

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleExpanded();
  };

  return (
    <section
      className={[
        styles.modelCardSection,
        expanded ? styles.modelCardSectionExpanded : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={styles.modelCardSummary}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggleExpanded}
        onKeyDown={handleHeaderKeyDown}
      >
        <span className={styles.modelCardSummaryTitle}>
          <FaIcon
            name={iconName}
            size="s"
            className={styles.modelCardSummaryIcon}
          />
          {title}
        </span>
        <AppButton
          variant="secondary"
          tone="gray"
          size="xs"
          iconName={expanded ? "chevron-up" : "chevron-down"}
          aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
          aria-expanded={expanded}
          onKeyDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            toggleExpanded();
          }}
        />
      </div>
      {expanded ? <div className={styles.modelCardSectionBody}>{children}</div> : null}
    </section>
  );
}

export function AiChatLabModelCardPanel({
  config,
  retrievalItems,
  examplePromptItems,
  onConfigView,
}: AiChatLabModelCardPanelProps) {
  return (
    <section className={styles.modelCardPanel}>
      <PanelHeader
        label="MODEL CARD"
        right={
          <AppButton
            variant="secondary"
            tone="gray"
            size="xs"
            iconName="sliders"
            onClick={onConfigView}
          >
            Config view
          </AppButton>
        }
      />
      <ScrollArea className={styles.modelCardBody} viewportClassName={styles.configViewport}>
        <div className={styles.modelCardInner}>
          <h2 className={styles.modelCardName}>
            {config.modelName.trim() || "Untitled chatbot"}
          </h2>

          <ModelCardSection title="Description" iconName="memo">
            <p className={styles.modelCardText}>
              {config.modelDescription.trim() || "No description added yet."}
            </p>
          </ModelCardSection>

          <ModelCardSection title="Intended Use" iconName="bullseye-arrow">
            <p className={styles.modelCardText}>
              {config.modelIntent.trim() || "No intended use added yet."}
            </p>
          </ModelCardSection>

          <ModelCardSection
            title="Limitations and Warnings"
            iconName="diamond-exclamation"
          >
            <p className={styles.modelCardText}>
              {config.modelLimitations.trim() || "No limitations added yet."}
            </p>
          </ModelCardSection>

          <ModelCardSection
            title="Testing and Evaluation"
            iconName="flask-vial"
          >
            <p className={styles.modelCardText}>
              {config.modelTestingEvaluation.trim() ||
                "No testing and evaluation notes added yet."}
            </p>
          </ModelCardSection>

          <ModelCardSection
            title="Example Prompts and Topics"
            iconName="message-lines"
          >
            {examplePromptItems.length > 0 ? (
              <div className={styles.modelCardPromptList}>
                {examplePromptItems.map((prompt, index) => (
                  <article key={`${prompt}-${index}`} className={styles.addedCard}>
                    <p className={styles.addedCardText}>{prompt}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.modelCardText}>No example prompts added yet.</p>
            )}
          </ModelCardSection>

          <ModelCardSection title="Technical Info" iconName="sliders">
            <dl className={styles.modelCardFields}>
              <ModelCardField label="Model name" value={config.modelName} />
              <ModelCardField label="Model" value={getModelLabel(config.modelId)} />
              <ModelCardField
                label="Temperature"
                value={config.temperature.toFixed(1)}
              />
              <ModelCardField
                label="System prompt"
                value={config.systemPrompt.trim() || "Not set"}
              />
              <ModelCardField
                label="Retrieval entries"
                value={`${retrievalItems.length} added`}
              />
            </dl>
          </ModelCardSection>
        </div>
      </ScrollArea>
    </section>
  );
}
