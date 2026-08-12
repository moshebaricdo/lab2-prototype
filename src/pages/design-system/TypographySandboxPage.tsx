import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppButton } from "../../components/ui/AppButton";
import { AppText } from "../../components/ui/AppText";
import { FaIcon } from "../../components/ui/icons/FaIcon";
import { Logo } from "../../components/ui/icons/Logo";
import { ResizableHandle } from "../../components/ui/ResizableHandle";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import {
  TYPOGRAPHY_CATEGORIES,
  TYPOGRAPHY_SPECIMENS,
  groupSpecimensByStyle,
  type TypographySpecimen,
  type TypographyStyleGroup,
} from "./typographyCatalog";
import styles from "./TypographySandboxPage.module.scss";

const SIDE_PANEL_DEFAULT_W = 350;
const SIDE_PANEL_MIN_W = 280;
const SIDE_PANEL_MAX_W = 600;

function defaultSample(specimen: TypographySpecimen): string {
  if (specimen.category === "Overline") return specimen.name;
  if (specimen.category === "Mono") return "const answer = 42;";
  if (specimen.category === "Link") return "Link text sample";
  return "The quick brown fox jumps over the lazy dog";
}

function compactSpecs(specimen: TypographySpecimen): string {
  return `${specimen.size} / ${specimen.lineHeight} · ${specimen.letterSpacing}`;
}

function mixinName(specimen: TypographySpecimen): string {
  if (specimen.weight) return `type-${specimen.variant}-${specimen.weight}`;
  return `type-${specimen.variant}`;
}

function appTextUsage(specimen: TypographySpecimen): string {
  if (specimen.weight) {
    return `<AppText variant="${specimen.variant}" weight="${specimen.weight}">`;
  }
  return `<AppText variant="${specimen.variant}">`;
}

function weightSegmentLabel(specimen: TypographySpecimen): string {
  if (specimen.weight === "bold") return "Bold";
  if (specimen.weight === "semibold") return "Semi";
  if (specimen.weight === "regular") return "Reg";
  return specimen.weightLabel;
}

export function TypographySandboxPage() {
  const location = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(SIDE_PANEL_DEFAULT_W);
  const [exported, setExported] = useState(false);
  const [sampleTexts, setSampleTexts] = useState<Record<string, string>>({});
  const [activeWeightIds, setActiveWeightIds] = useState<Record<string, string>>(
    {},
  );

  const groupsByCategory = useMemo(() => {
    const grouped = groupSpecimensByStyle(TYPOGRAPHY_SPECIMENS);
    return TYPOGRAPHY_CATEGORIES.map((category) => ({
      category,
      groups: grouped.filter((group) => group.category === category),
    }));
  }, []);

  const selected = useMemo(
    () => TYPOGRAPHY_SPECIMENS.find((specimen) => specimen.id === selectedId) ?? null,
    [selectedId],
  );

  const selectedSample = selected
    ? (sampleTexts[selected.variant] ?? defaultSample(selected))
    : null;

  function handleExportClick() {
    setExported(true);
    window.setTimeout(() => setExported(false), 1600);
  }

  function setSampleText(variant: string, text: string) {
    setSampleTexts((prev) => ({ ...prev, [variant]: text }));
  }

  function setGroupWeight(groupKey: string, specimenId: string) {
    setActiveWeightIds((prev) => ({ ...prev, [groupKey]: specimenId }));
    setSelectedId(specimenId);
  }

  function selectGroup(groupKey: string, fallbackId: string) {
    setSelectedId(activeWeightIds[groupKey] ?? fallbackId);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerStart}>
          <Link
            to="/levels"
            className={styles.headerLogo}
            aria-label="Go to levels page"
          >
            <Logo />
          </Link>
          <nav className={styles.headerNav} aria-label="Design system">
            <Link
              to="/design-system/colors"
              className={`${styles.headerNavLink} ${
                location.pathname.startsWith("/design-system/colors")
                  ? styles.headerNavLinkActive
                  : ""
              }`}
            >
              Color
            </Link>
            <Link
              to="/design-system/typography"
              className={`${styles.headerNavLink} ${
                location.pathname.startsWith("/design-system/typography")
                  ? styles.headerNavLinkActive
                  : ""
              }`}
            >
              Typography
            </Link>
            <Link
              to="/design-system/cads"
              className={`${styles.headerNavLink} ${
                location.pathname.startsWith("/design-system/cads")
                  ? styles.headerNavLinkActive
                  : ""
              }`}
            >
              CADS packages
            </Link>
          </nav>
        </div>
        <AppButton
          variant="secondary"
          tone="white"
          size="s"
          iconName={exported ? "check" : "download"}
          className={styles.headerExportButton}
          onClick={handleExportClick}
          aria-label={exported ? "Exported" : "Export CSS"}
        >
          Export CSS
        </AppButton>
      </header>

      <div className={styles.body}>
        <main className={styles.catalog} aria-label="Typography catalog">
          <AppText
            variant="heading-h1"
            weight="semibold"
            as="h1"
            className={styles.pageTitle}
          >
            Typography
          </AppText>

          {groupsByCategory.map(({ category, groups }) => (
            <section key={category} className={styles.section}>
              <AppText
                variant="overline-2"
                as="h2"
                className={styles.sectionTitle}
              >
                {category}
              </AppText>
              <div className={styles.groupList}>
                {groups.map((group) => (
                  <StyleGroupCard
                    key={group.key}
                    group={group}
                    selectedId={selectedId}
                    activeWeightId={activeWeightIds[group.key] ?? null}
                    sampleText={
                      sampleTexts[group.key] ?? defaultSample(group.specimens[0])
                    }
                    onSelectGroup={() =>
                      selectGroup(
                        group.key,
                        group.specimens.find((s) => s.weight === "regular")
                          ?.id ?? group.specimens[0].id,
                      )
                    }
                    onWeightChange={(specimenId) =>
                      setGroupWeight(group.key, specimenId)
                    }
                    onSampleChange={(text) => setSampleText(group.key, text)}
                  />
                ))}
              </div>
            </section>
          ))}
        </main>

        <ResizableHandle
          onResize={(delta) =>
            setPanelWidth((prev) =>
              Math.max(SIDE_PANEL_MIN_W, Math.min(SIDE_PANEL_MAX_W, prev - delta)),
            )
          }
        />

        <aside
          className={styles.sidePanel}
          style={{ width: panelWidth }}
          aria-label="Style inspector"
        >
          <div className={styles.sidePanelBody}>
            {selected && selectedSample != null ? (
              <StyleInspector
                specimen={selected}
                sampleText={selectedSample}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <div className={styles.sidePanelEmptyWrap}>
                <div className={styles.sidePanelEmptyState}>
                  <div className={styles.sidePanelEmptyIcon}>
                    <FaIcon name="font" size="m" />
                  </div>
                  <h2 className={styles.sidePanelEmptyTitle}>Nothing selected</h2>
                  <p className={styles.sidePanelEmptyText}>
                    Select a type style to inspect its specs and usage.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StyleGroupCard({
  group,
  selectedId,
  activeWeightId,
  sampleText,
  onSelectGroup,
  onWeightChange,
  onSampleChange,
}: {
  group: TypographyStyleGroup;
  selectedId: string | null;
  activeWeightId: string | null;
  sampleText: string;
  onSelectGroup: () => void;
  onWeightChange: (specimenId: string) => void;
  onSampleChange: (text: string) => void;
}) {
  const active =
    group.specimens.find((specimen) => specimen.id === activeWeightId) ??
    group.specimens.find((specimen) => specimen.weight === "regular") ??
    group.specimens[0];
  const isGroupSelected = group.specimens.some(
    (specimen) => specimen.id === selectedId,
  );
  const hasWeights = group.specimens.length > 1;
  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!editing || !editRef.current) return;
    const node = editRef.current;
    node.textContent = sampleText;
    node.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
    // Only seed the editor when entering edit mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sampleText is the seed value at edit start
  }, [editing]);

  const weightOptions = group.specimens.map((specimen) => ({
    value: specimen.id,
    label: weightSegmentLabel(specimen),
  }));

  function commitEdit(next: string) {
    const trimmed = next.replace(/\u00a0/g, " ");
    if (trimmed !== sampleText) onSampleChange(trimmed);
    setEditing(false);
  }

  return (
    <article
      className={`${styles.styleCard} ${isGroupSelected ? styles.styleCardSelected : ""} ${
        editing ? styles.styleCardEditing : ""
      }`}
    >
      <div
        className={styles.styleCardBody}
        onClick={() => {
          if (!editing) onSelectGroup();
        }}
        role="button"
        tabIndex={editing ? -1 : 0}
        aria-pressed={isGroupSelected}
        onKeyDown={(event) => {
          if (editing) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelectGroup();
          }
        }}
      >
        <div className={styles.styleCardHeader}>
          <span className={styles.styleCardName}>{group.label}</span>
          <span className={styles.styleCardSpecs}>{compactSpecs(active)}</span>
        </div>
        <div
          className={styles.styleCardSpecimen}
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelectGroup();
            setEditing(true);
          }}
        >
          <AppText
            ref={editRef}
            variant={active.variant}
            weight={active.weight}
            as="div"
            className={`${styles.specimenText} ${
              editing ? styles.specimenTextEditing : ""
            }`}
            contentEditable={editing}
            suppressContentEditableWarning
            onClick={(event) => {
              if (editing) event.stopPropagation();
            }}
            onBlur={(event) => {
              if (!editing) return;
              commitEdit(event.currentTarget.textContent ?? "");
            }}
            onKeyDown={(event) => {
              if (!editing) return;
              event.stopPropagation();
              if (event.key === "Escape") {
                event.preventDefault();
                event.currentTarget.textContent = sampleText;
                setEditing(false);
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          >
            {editing ? null : sampleText}
          </AppText>
        </div>
      </div>

      {hasWeights ? (
        <div
          className={styles.weightRow}
          onClick={(event) => event.stopPropagation()}
        >
          <SegmentedControl
            size="xs"
            options={weightOptions}
            value={active.id}
            onChange={onWeightChange}
          />
        </div>
      ) : null}
    </article>
  );
}

function StyleInspector({
  specimen,
  sampleText,
  onClose,
}: {
  specimen: TypographySpecimen;
  sampleText: string;
  onClose: () => void;
}) {
  return (
    <div className={styles.inspector}>
      <div className={styles.inspectorHeader}>
        <span className={styles.inspectorHeaderLabel}>{specimen.category}</span>
        <AppButton
          className={styles.inspectorCloseButton}
          variant="tertiary"
          tone="gray"
          size="xs"
          iconName="xmark"
          onClick={onClose}
          aria-label="Close panel"
        />
      </div>

      <div className={styles.inspectorBody}>
        <div className={styles.inspectorBodySection}>
          <div className={styles.inspectorPreview}>
            <AppText
              variant={specimen.variant}
              weight={specimen.weight}
              as="div"
              className={styles.specimenText}
            >
              {sampleText}
            </AppText>
          </div>
        </div>

        <div className={styles.inspectorBodySection}>
          <InspectorField label="Style name" value={specimen.name} />
          <InspectorField label="Family" value={specimen.family} />
          <InspectorField label="Weight" value={specimen.weightLabel} />
        </div>

        <div className={styles.inspectorBodySection}>
          <InspectorField label="Size" value={specimen.size} />
          <InspectorField label="Line height" value={specimen.lineHeight} />
          <InspectorField label="Letter spacing" value={specimen.letterSpacing} />
          {specimen.notes ? (
            <InspectorField label="Notes" value={specimen.notes} />
          ) : null}
        </div>

        <div className={styles.inspectorBodySection}>
          <InspectorField label="AppText" value={appTextUsage(specimen)} mono />
          <InspectorField label="SCSS mixin" value={`@include ${mixinName(specimen)}`} mono />
        </div>
      </div>
    </div>
  );
}

function InspectorField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className={styles.inspectorRow}>
      <label className={styles.inspectorRowLabel}>{label}</label>
      <input
        className={`${styles.inspectorInput} ${styles.inspectorRowControl} ${
          mono ? styles.inspectorInputMono : ""
        }`}
        value={value}
        readOnly
        spellCheck={false}
        onFocus={(event) => event.currentTarget.select()}
      />
    </div>
  );
}

export default TypographySandboxPage;
