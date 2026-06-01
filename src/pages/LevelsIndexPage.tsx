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
  drawerImprovementsExperimentLinks,
  uploadMechanismsProgressionLinks,
  webLab2ExperimentLinks,
  webLab2ValidationProgressionLinks,
  webLab2LevelLinks,
} from "./levelTypeLinks";
import { buildShareLinkDropdownItems } from "../lib/shareLinkActions";
import { isProgressionLevelPath } from "../lib/levelShareLinks";
import { FaIcon } from "../components/ui/icons/FaIcon";
import { getLevelTypeIconConfig } from "../lib/levelTypeIcon";
import styles from "./LevelsIndexPage.module.scss";

function levelTypeTooltipStartIcon(path: string) {
  const icon = getLevelTypeIconConfig(path);
  return <FaIcon family={icon.family} name={icon.name} size="xs" />;
}

interface LevelPage {
  name: string;
  path: string;
}

interface LevelTypeEntry {
  levelType: string;
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
        pages: aiChatLabLevelLinks,
      },
      {
        levelType: "Web Lab 2",
        pages: webLab2LevelLinks,
      },
      {
        levelType: "Python Lab",
        pages: pythonLabLevelLinks,
      },
    ],
  },
  {
    title: "Assessment",
    entries: [
      {
        levelType: "Multi-choice",
        pages: multiChoiceLevelLinks,
      },
      {
        levelType: "Free response",
        pages: freeResponseLevelLinks,
      },
      {
        levelType: "Match",
        pages: matchLevelLinks,
      },
      {
        levelType: "Levelgroup",
        pages: levelGroupLevelLinks,
      },
    ],
  },
  {
    title: "Misc",
    entries: [
      {
        levelType: "Bubble choice",
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
  "/levels/progression-upload-mechanisms": "Sample progression",
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
    shareMode: "locked-level" | "locked-progression" | "flow",
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
                    menuWidth={208}
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
                    items={buildShareLinkDropdownItems(
                      {
                        showLockedProgression: isProgressionLevelPath(v.basePath),
                      },
                      {
                        onLockedLevel: () => copyVariantShareLink(v, "locked-level"),
                        onLockedProgression: () =>
                          copyVariantShareLink(v, "locked-progression"),
                        onFlow: () => copyVariantShareLink(v, "flow"),
                      },
                    )}
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
        <h1 className={styles.pageTitle}>Lab2 Sandbox</h1>
        <p className={styles.pageSubtitle}>
          This environment provides functional base templates for Lab2 environments and assessment levels.
        </p>

        <SavedVariantsSection />

        <div className={styles.categories}>
          <CollapsibleSectionCard
            title="Sample Progressions"
            expanded={sampleExpanded}
            onToggle={() => setSampleExpanded((current) => !current)}
          >
            <div className={styles.entryGrid}>
              <div className={`${styles.card} ${styles.cardWithDescription}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    Intro to HTML &amp; CSS
                  </h3>
                  <p className={styles.cardDescription}>
                    Lab, reflection, path choice, project, and checkpoint.
                  </p>
                </div>
                <div className={styles.bubbleRow}>
                  {sampleProgressionLinks.map((page, index) => (
                    <Tooltip
                      key={page.path}
                      content={page.name}
                      position="top"
                      sideOffset={8}
                      startIcon={levelTypeTooltipStartIcon(page.path)}
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
              <div className={`${styles.card} ${styles.cardWithDescription}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    Tutor Instructions and Validation
                  </h3>
                  <p className={styles.cardDescription}>
                    Experiments with instructions and validation via Tutor.
                  </p>
                </div>
                <div className={styles.bubbleRow}>
                  {webLab2ValidationProgressionLinks.map((page, index) => (
                    <Tooltip
                      key={page.path}
                      content={page.name}
                      position="top"
                      sideOffset={8}
                      startIcon={levelTypeTooltipStartIcon(page.path)}
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
              <div className={`${styles.card} ${styles.cardWithDescription}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Upload Mechanisms</h3>
                  <p className={styles.cardDescription}>
                    Three Tutor upload patterns side by side.
                  </p>
                </div>
                <div className={styles.bubbleRow}>
                  {uploadMechanismsProgressionLinks.map((page, index) => (
                    <Tooltip
                      key={page.path}
                      content={page.name}
                      position="top"
                      sideOffset={8}
                      startIcon={levelTypeTooltipStartIcon(page.path)}
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
              <div className={`${styles.card} ${styles.cardWithDescription}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Drawer Improvements</h3>
                  <p className={styles.cardDescription}>
                    Improvements to drawer behavior and visual cues.
                  </p>
                </div>
                <div className={styles.bubbleRow}>
                  {drawerImprovementsExperimentLinks.map((page, index) => (
                    <Tooltip
                      key={page.path}
                      content={page.name}
                      position="top"
                      sideOffset={8}
                      startIcon={levelTypeTooltipStartIcon(page.path)}
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
              <div className={`${styles.card} ${styles.cardWithDescription}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Web Lab 2 Experiments</h3>
                  <p className={styles.cardDescription}>
                    Standalone Tutor action card and validation review demos.
                  </p>
                </div>
                <div className={styles.bubbleRow}>
                  {webLab2ExperimentLinks.map((page, index) => (
                    <Tooltip
                      key={page.path}
                      content={page.name}
                      position="top"
                      sideOffset={8}
                      startIcon={levelTypeTooltipStartIcon(page.path)}
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
              <div
                className={[
                  styles.entryGrid,
                  category.title === "Lab environments" && styles.entryGridThreeCol,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {category.entries.map((entry) => (
                  <div
                    key={entry.levelType}
                    className={`${styles.card} ${styles.cardCompact}`}
                  >
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{entry.levelType}</h3>
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
