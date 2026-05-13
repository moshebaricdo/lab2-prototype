import { Link } from "react-router-dom";
import { Tooltip } from "../components/ui/Tooltip";
import { Dialog } from "../components/ui/Dialog";
import { AppButton } from "../components/ui/AppButton";
import { AppActionDropdown } from "../components/ui/AppDropdown";
import { useState, useCallback, type ReactNode } from "react";
import {
  useSavedVariants,
  buildVariantAbsoluteUrl,
  buildVariantUrl,
} from "../hooks/useSavedVariants";
import type { SavedVariant } from "../hooks/useSavedVariants";
import { generatePromotedCode } from "../utils/promoteToCode";
import type { PromotedCode } from "../utils/promoteToCode";
import {
  aiChatLabLevelLinks,
  bubbleChoiceLevelLinks,
  freeResponseLevelLinks,
  levelGroupLevelLinks,
  matchLevelLinks,
  multiChoiceLevelLinks,
  pythonLabLevelLinks,
  sampleProgressionLinks,
  webLab2ValidationProgressionLinks,
  webLab2LevelLinks,
} from "./levelTypeLinks";
import styles from "./LevelsIndexPage.module.scss";

interface LevelPage {
  name: string;
  path: string;
}

interface LevelTypeEntry {
  levelType: string;
  description: string;
  pages: LevelPage[];
}

interface LevelCategory {
  title: string;
  entries: LevelTypeEntry[];
}

const LEVEL_CATEGORIES: LevelCategory[] = [
  {
    title: "Lab environments",
    entries: [
      {
        levelType: "AI Chat Lab",
        description: "Prompting, model configuration, and chat stream prototypes.",
        pages: aiChatLabLevelLinks,
      },
      {
        levelType: "Web Lab 2",
        description: "Current full-featured prototype environment.",
        pages: webLab2LevelLinks,
      },
      {
        levelType: "Python Lab",
        description: "Python coding environment with console output.",
        pages: pythonLabLevelLinks,
      },
    ],
  },
  {
    title: "Assessment",
    entries: [
      {
        levelType: "Multi-choice",
        description: "Thin vertical slice with local submit feedback.",
        pages: multiChoiceLevelLinks,
      },
      {
        levelType: "Free response",
        description: "Thin vertical slice with local text submission.",
        pages: freeResponseLevelLinks,
      },
      {
        levelType: "Match",
        description: "Thin vertical slice with drag-and-drop matching.",
        pages: matchLevelLinks,
      },
      {
        levelType: "Levelgroup",
        description: "Thin vertical slice combining multi, free response, and match.",
        pages: levelGroupLevelLinks,
      },
    ],
  },
  {
    title: "Misc",
    entries: [
      {
        levelType: "Bubble choice",
        description: "Choose one of four authored paths for the same concept.",
        pages: bubbleChoiceLevelLinks,
      },
    ],
  },
];

const PATH_TO_LEVEL_TYPE: Record<string, string> = {
  "/levels/multi": "Multi-choice",
  "/levels/free-response": "Free response",
  "/levels/match-definition-bank": "Match",
  "/levels/match-connector": "Match",
  "/levels/match-swipe-cards": "Match",
  "/levels/pythonlab": "Python Lab",
  "/levels/aichatlab": "AI Chat Lab",
  "/levels/weblab2": "Web Lab 2",
  "/levels/levelgroup": "Levelgroup",
  "/levels/bubble-choice": "Bubble choice",
  "/levels/progression": "Sample progression",
};

function levelTypeForPath(basePath: string): string {
  if (PATH_TO_LEVEL_TYPE[basePath]) return PATH_TO_LEVEL_TYPE[basePath];
  for (const [prefix, label] of Object.entries(PATH_TO_LEVEL_TYPE)) {
    if (basePath.startsWith(prefix)) return label;
  }
  return basePath;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <AppButton
      variant="secondary"
      tone="black"
      size="xs"
      iconName={copied ? "check" : "clipboard"}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </AppButton>
  );
}

function PromoteDialog({
  promoted,
  onClose,
}: {
  promoted: PromotedCode;
  onClose: () => void;
}) {
  return (
    <Dialog open title="Promote to code" onClose={onClose} size="l">
      <div className={styles.promoteSteps}>
        <section>
          <div className={styles.promoteStepHeader}>
            <p className={styles.promoteStepLabel}>
              1. Create <code>src/pages/{promoted.pageFilePath}</code>
            </p>
            <CopyButton text={promoted.pageCode} />
          </div>
          <pre className={styles.codeBlock}>{promoted.pageCode}</pre>
        </section>
        <section>
          <div className={styles.promoteStepHeader}>
            <p className={styles.promoteStepLabel}>
              2. Add route to <code>App.tsx</code>
            </p>
            <CopyButton text={promoted.routeEntry} />
          </div>
          <pre className={styles.codeBlock}>{promoted.routeEntry}</pre>
        </section>
        <section>
          <div className={styles.promoteStepHeader}>
            <p className={styles.promoteStepLabel}>
              3. Add link to <code>levelTypeLinks.ts</code>
            </p>
            <CopyButton text={promoted.linkEntry} />
          </div>
          <pre className={styles.codeBlock}>{promoted.linkEntry}</pre>
        </section>
      </div>
    </Dialog>
  );
}

function formatTimestamp(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CollapsibleSectionCard({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={styles.variantsCard}>
      <div className={styles.variantsToggle}>
        <span className={styles.variantsToggleTitle}>{title}</span>
        <div className={styles.variantsToggleRight}>
          <button
            type="button"
            className={styles.variantsToggleMetaButton}
            aria-expanded={expanded}
            onClick={onToggle}
          >
            {expanded ? "Collapse section" : "Expand section"}
          </button>
          <AppButton
            variant="secondary"
            tone="gray"
            size="xs"
            iconName={expanded ? "chevron-up" : "chevron-down"}
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
            onClick={onToggle}
          />
        </div>
      </div>
      {expanded ? <div className={styles.sectionBody}>{children}</div> : null}
    </section>
  );
}

function SavedVariantsSection() {
  const { variants, deleteVariant } = useSavedVariants();
  const [promoteTarget, setPromoteTarget] = useState<PromotedCode | null>(
    null,
  );
  const [expanded, setExpanded] = useState(true);

  const handlePromote = useCallback((v: SavedVariant) => {
    const result = generatePromotedCode(v);
    if (result) setPromoteTarget(result);
  }, []);

  const copyVariantShareLink = useCallback((
    variant: SavedVariant,
    shareMode: "locked" | "flow",
  ) => {
    navigator.clipboard.writeText(
      buildVariantAbsoluteUrl(variant.basePath, variant.overrides, {
        searchParams: variant.searchParams,
        shareMode,
      }),
    );
  }, []);

  return (
    <div className={styles.variantsSection}>
      {promoteTarget && (
        <PromoteDialog
          promoted={promoteTarget}
          onClose={() => setPromoteTarget(null)}
        />
      )}
      <CollapsibleSectionCard
        title="Variants"
        expanded={expanded}
        onToggle={() => setExpanded((current) => !current)}
      >
        {variants.length === 0 ? (
          <p className={styles.emptySectionText}>
            No saved variants yet. Save a variant from a level page and it will show up here.
          </p>
        ) : (
          <div className={styles.variantsList}>
            {variants.map((v) => (
              <div key={v.id} className={styles.variantRow}>
                <div className={styles.variantInfo}>
                  <Link
                    to={buildVariantUrl(v.basePath, v.overrides, {
                      searchParams: v.searchParams,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.variantNameLink}
                  >
                    {v.name}
                  </Link>
                  <div className={styles.variantMeta}>
                    <span className={styles.typePill}>
                      {levelTypeForPath(v.basePath)}
                    </span>
                    <span className={styles.variantDate}>
                      {formatTimestamp(v.savedAt)}
                    </span>
                  </div>
                </div>
                <div className={styles.variantActions}>
                  <Tooltip content="Open in new tab" position="top">
                    <Link
                      to={buildVariantUrl(v.basePath, v.overrides, {
                        searchParams: v.searchParams,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <AppButton
                        variant="tertiary"
                        tone="gray"
                        size="xs"
                        iconName="arrow-up-right-from-square"
                        tabIndex={-1}
                      />
                    </Link>
                  </Tooltip>
                  <AppActionDropdown
                    size="xs"
                    align="end"
                    side="bottom"
                    sideOffset={6}
                    menuWidth={172}
                    listLabel={`Share ${v.name}`}
                    trigger={
                      <AppButton
                        variant="tertiary"
                        tone="gray"
                        size="xs"
                        iconName="share-nodes"
                        aria-label={`Share ${v.name}`}
                        title="Share links"
                      />
                    }
                    items={[
                      {
                        id: "locked-share",
                        label: "Locked share link",
                        iconName: "lock",
                        onSelect: () => copyVariantShareLink(v, "locked"),
                      },
                      {
                        id: "flow-share",
                        label: "Flow share link",
                        iconName: "diagram-project",
                        onSelect: () => copyVariantShareLink(v, "flow"),
                      },
                    ]}
                  />
                  <Tooltip content="Promote to code" position="top">
                    <AppButton
                      variant="tertiary"
                      tone="gray"
                      size="xs"
                      iconName="code"
                      onClick={() => handlePromote(v)}
                    />
                  </Tooltip>
                  <Tooltip content="Delete" position="top">
                    <AppButton
                      variant="tertiary"
                      tone="gray"
                      size="xs"
                      iconName="trash"
                      onClick={() => deleteVariant(v.id)}
                    />
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSectionCard>
    </div>
  );
}

export function LevelsIndexPage() {
  const [sampleExpanded, setSampleExpanded] = useState(true);
  const [levelTypesExpanded, setLevelTypesExpanded] = useState(true);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Lab2 Level Types</h1>
        <p className={styles.pageSubtitle}>
          Explore level types and jump directly into implemented page variants.
        </p>

        <SavedVariantsSection />

        <div className={styles.categories}>
          <CollapsibleSectionCard
            title="Sample Progressions"
            expanded={sampleExpanded}
            onToggle={() => setSampleExpanded((current) => !current)}
          >
            <div className={styles.entryGrid}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>
                      Intro to HTML &amp; CSS
                    </h3>
                    <p className={styles.cardDescription}>
                      Web Lab → Free Response → Bubble Choice → Practice Project → Checkpoint
                    </p>
                  </div>
                </div>
                <div className={styles.bubbleRow}>
                  {sampleProgressionLinks.map((page, index) => (
                    <Tooltip
                      key={page.path}
                      content={page.name}
                      position="top"
                      sideOffset={8}
                    >
                      <Link
                        to={page.path}
                        aria-label={`Open ${page.name}`}
                        className={styles.bubble}
                      >
                        {index + 1}
                      </Link>
                    </Tooltip>
                  ))}
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>
                      Web Lab 2 Validation Lab
                    </h3>
                    <p className={styles.cardDescription}>
                      Technical fix → Open-ended creation → Hybrid refinement
                    </p>
                  </div>
                </div>
                <div className={styles.bubbleRow}>
                  {webLab2ValidationProgressionLinks.map((page, index) => (
                    <Tooltip
                      key={page.path}
                      content={page.name}
                      position="top"
                      sideOffset={8}
                    >
                      <Link
                        to={page.path}
                        aria-label={`Open ${page.name}`}
                        className={styles.bubble}
                      >
                        {index + 1}
                      </Link>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSectionCard>

          <CollapsibleSectionCard
            title="Level Types"
            expanded={levelTypesExpanded}
            onToggle={() => setLevelTypesExpanded((current) => !current)}
          >
            {LEVEL_CATEGORIES.map((category) => (
              <section key={category.title} className={styles.levelTypeGroup}>
                <h2 className={styles.sectionHeading}>{category.title}</h2>
              <div className={styles.entryGrid}>
                {category.entries.map((entry) => (
                  <div key={entry.levelType} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3 className={styles.cardTitle}>
                          {entry.levelType}
                        </h3>
                        <p className={styles.cardDescription}>
                          {entry.description}
                        </p>
                      </div>
                    </div>
                    <div className={styles.bubbleRow}>
                      {entry.pages.map((page, index) => (
                        <Tooltip
                          key={page.path}
                          content={page.name}
                          position="top"
                          sideOffset={8}
                        >
                          <Link
                            to={page.path}
                            aria-label={`Open ${page.name}`}
                            className={styles.bubble}
                          >
                            {index + 1}
                          </Link>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              </section>
            ))}
          </CollapsibleSectionCard>
        </div>
      </div>
    </main>
  );
}
