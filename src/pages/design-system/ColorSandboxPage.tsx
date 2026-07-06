import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  Background,
  BackgroundVariant,
  Controls,
  ControlButton,
  MiniMap,
  Panel,
  PanOnScrollMode,
  ReactFlow,
  SelectionMode,
  useNodesState,
  type Edge,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AppButton } from "../../components/ui/AppButton";
import { AppCheckbox } from "../../components/ui/AppCheckbox";
import { AppNativeSelect } from "../../components/ui/AppDropdown";
import { Tooltip } from "../../components/ui/Tooltip";
import { FaIcon } from "../../components/ui/icons/FaIcon";
import { useTheme, type BrandTheme, type ThemeMode } from "../../hooks/useTheme";
import {
  loadColorSandboxSystem,
  notifyColorSandboxUpdated,
  persistColorSandboxDoc,
  readColorSandboxApplyRuntime,
  readColorSandboxReadOnly,
  setColorSandboxReadOnly,
} from "../../lib/colorSandbox/colorSandboxStorage";
import {
  setColorSandboxRuntimePreview,
} from "../../lib/colorSandbox/colorSandboxRuntime";
import {
  addFamily,
  addSemanticFamily,
  addSemanticSubGroup,
  addSemanticToken,
  addStep,
  buildColorSystem,
  duplicatePrimitiveFamily,
  duplicateSemanticFamily,
  deleteCollection,
  deleteFamily,
  deleteSemanticFamily,
  deleteSemanticSubGroup,
  deleteSemanticToken,
  deleteStep,
  cssColor,
  colorAlpha,
  buildCodeAiColorSystem,
  rgbHex,
  setHexAlpha,
  familiesByCollection,
  familyMidHex,
  familyOfStep,
  isTransparentColor,
  isSteppedPrimitiveFamily,
  isUnsetPrimitiveHex,
  movePrimitiveFamily,
  moveSemanticFamilyToSubGroup,
  moveSemanticFamilyToSurface,
  neutralBackgroundHex,
  neutralBorderHex,
  normalizeSemanticRole,
  reorderPrimitiveFamilyInCollection,
  reorderSemanticFamilyInSubGroup,
  reorderSemanticTokenInFamily,
  normalizeHex,
  parseSemanticFamilySlotId,
  parseSemanticSubGroupSlotId,
  readableTextOn,
  remapSemantic,
  setSemanticTokenComment,
  renamePrimitiveStep,
  renameCollection,
  renameFamily,
  setPrimitiveFamilyStepped,
  renameSemanticCollection,
  renameSemanticFamily,
  renameSemanticTokenRole,
  renameSemanticSubGroup,
  SEMANTIC_COLLECTION_LABELS,
  semanticFamilyKeysForSurface,
  semanticFamilyKeysForSubGroup,
  semanticFamilyLabel,
  semanticFamilySlotId,
  semanticHex,
  semanticTokenRolesForFamily,
  semanticTokensForFamily,
  findSemanticToken,
  formatContrastRatio,
  sortPrimitiveSteps,
  STANDARD_PRIMITIVE_STEPS,
  surfaceColorContrastChecks,
  textTokenContrastChecks,
  type ContrastCheck,
  semanticSubGroupForFamily,
  semanticSubGroupSlotId,
  semanticSubGroupsForSurface,
  stepIndex,
  updatePrimitiveHex,
  type ColorSystem,
  type ThemeKey,
} from "./colorSystemData";
import {
  buildPrimitiveColorsCss,
  buildSemanticColorsCss,
  primitiveVarName,
  semanticExportVarName,
} from "./colorSystemCssExport";
import { colorSystemEdgeTypes } from "./ColorSystemEdges";
import {
  colorSystemNodeTypes,
  type CollectionNodeData,
  type PrimitiveNodeData,
  type SemanticNodeData,
  type SemanticSubGroupNodeData,
} from "./ColorSystemNodes";
import { scratchNodeTypes, ScratchActionsProvider } from "./ColorScratchNodes";
import { ColorScratchToolbar } from "./ColorScratchToolbar";
import {
  createScratchNode,
  fromScratchFlowNode,
  isScratchId,
  loadScratchNodes,
  measureScratchTextWidth,
  persistScratchNodes,
  toScratchFlowNode,
  type ScratchFlowNode,
  type ScratchNodeData,
  type ScratchNodeKind,
} from "../../lib/colorSandbox/scratchLayer";
import styles from "./ColorSandboxPage.module.scss";

const allNodeTypes = { ...colorSystemNodeTypes, ...scratchNodeTypes };

/** Default fills for freshly created scratch nodes. */
const SCRATCH_DEFAULT_SWATCH_FILL = "#4B5563";
const SCRATCH_DEFAULT_TEXT_FILL = "#111827";
/** Horizontal gap between the semantic column and newly spawned scratch nodes. */
const SCRATCH_SPAWN_OFFSET_X = 320;

const COLLECTION_GAP_X = 44;
const SEMANTIC_BAND_GAP = 96;
const CARD_PADDING = 16;
const FAMILY_GAP = 12;
const SWATCH_CELL_W = 54;
const SWATCH_GAP = 6;
const SWATCH_GRID_PADDING = 12;
const SEMANTIC_CHIP_GAP = 4;
const SEMANTIC_CHIP_X_PAD = 8;
const SEMANTIC_CHIP_SWATCH = 12;
const SEMANTIC_CHIP_INNER_GAP = 6;

/** Lightness stops shown in the primitive step picker (matches prod scale). */
const PRIMITIVE_STEP_SPECTRUM = STANDARD_PRIMITIVE_STEPS.map((step) => Number(step));
const SEMANTIC_CHIP_CHAR_W = 7;
const SEMANTIC_SUBGROUP_MAX_W = 500;
const SEMANTIC_FAMILY_HEADER_H = 44;
const SEMANTIC_FAMILY_BODY_V_PAD = 20;
const SEMANTIC_CHIP_H = 24;
const SEMANTIC_SURFACE_GROUP_H_PAD = 24;
const SEMANTIC_FAMILY_HEIGHT_BUFFER = 4;
/** Matches `.subGroupCardHeader` rendered height (includes 12px top padding). */
const SUB_GROUP_HEADER_H = 48;
const SUB_GROUP_GAP_X = 12;
/** Single-row primitive family height (header + one swatch row). */
const PRIMITIVE_FAMILY_H = 120;
/** Matches `.collectionCardHeader` rendered height (includes 16px top padding). */
const COLLECTION_HEADER_H = 61;
/** Space between the header block and the first family card. */
const HEADER_FAMILY_GAP = 16;
const EDGE_COLOR = "var(--sandbox-border-neutral-primary, var(--ds-borders-neutral-primary))";
const EDGE_WIDTH = 1.5;
/** React Flow pan filter — pan only on empty pane, not while interacting with nodes. */
const REACT_FLOW_NO_PAN = {
  className: "nopan",
  draggable: false,
  selectable: false,
  connectable: false,
} as const;

type ScratchCanvasTool = "select" | "grab";

const BRAND_OPTIONS: Array<{ value: BrandTheme; label: string }> = [
  { value: "codeOrg", label: "Code.org" },
  { value: "codeAi", label: "CodeAI" },
];
const MODE_OPTIONS: Array<{ value: ThemeKey; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const CONTAINER_DROP_KINDS = new Set([
  "primitiveCollection",
  "semanticCollection",
  "semanticSubGroup",
]);

const FAMILY_DROP_KINDS = new Set(["primitiveFamily", "semanticFamily"]);
const CHIP_DROP_KINDS = new Set(["semanticChip"]);

/** Family under pointer wins for reorder; chips win while dragging a chip. */
const colorSystemCollisionDetection: CollisionDetection = (args) => {
  const activeKind = args.active?.data.current?.kind;
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    if (typeof activeKind === "string" && CHIP_DROP_KINDS.has(activeKind)) {
      const chipHit = pointerHits.find((collision) => {
        const container = args.droppableContainers.find((item) => item.id === collision.id);
        const kind = container?.data?.current?.kind;
        return typeof kind === "string" && CHIP_DROP_KINDS.has(kind);
      });
      if (chipHit) return [chipHit];
      return pointerHits;
    }

    const familyHit = pointerHits.find((collision) => {
      const container = args.droppableContainers.find((item) => item.id === collision.id);
      const kind = container?.data?.current?.kind;
      return typeof kind === "string" && FAMILY_DROP_KINDS.has(kind);
    });
    if (familyHit) return [familyHit];

    const containerHit = pointerHits.find((collision) => {
      const container = args.droppableContainers.find((item) => item.id === collision.id);
      const kind = container?.data?.current?.kind;
      return typeof kind === "string" && CONTAINER_DROP_KINDS.has(kind);
    });
    if (containerHit) return [containerHit];

    return pointerHits;
  }
  return closestCenter(args);
};

type Selection =
  | { kind: "step"; id: string }
  | { kind: "family"; id: string }
  | { kind: "collection"; id: string }
  | { kind: "semanticCollection"; id: string }
  | { kind: "semanticSubGroup"; id: string; surface: string }
  | { kind: "semanticFamily"; id: string; surface: string }
  | { kind: "semantic"; surface: string; familyKey: string; role: string }
  | null;

function structuredCloneSystem(system: ColorSystem): ColorSystem {
  return JSON.parse(JSON.stringify(system)) as ColorSystem;
}

function layoutSignature(system: ColorSystem): string {
  return [
    ...system.collections.map((collection) => `c:${collection.id}`),
    ...system.families.map(
      (family) => `f:${family.id}:${family.steps.length}:${family.collectionId}`,
    ),
    ...Object.entries(system.primitiveFamilyOrders ?? {}).map(
      ([collectionId, order]) => `po:${collectionId}:${order.join(",")}`,
    ),
    ...Object.entries(system.semanticFamilyOrders ?? {}).map(
      ([slotId, order]) => `so:${slotId}:${order.join(",")}`,
    ),
    ...Object.entries(system.semanticTokenOrders ?? {}).map(
      ([slotId, order]) => `to:${slotId}:${order.join(",")}`,
    ),
    ...system.semanticCollections.map((collection) => `sc:${collection.id}`),
    ...system.semanticCollections.flatMap((collection) =>
      semanticFamilyKeysForSurface(system, collection.id).map((familyKey) => {
        const chipCount = system.semantics.filter(
          (token) => token.surface === collection.id && token.familyKey === familyKey,
        ).length;
        return `sf:${semanticFamilySlotId(collection.id, familyKey)}:${chipCount}:${semanticSubGroupForFamily(system, familyKey)}`;
      }),
    ),
  ].join("|");
}

function computePrimitiveBandHeight(system: ColorSystem): number {
  const firstFamilyY = COLLECTION_HEADER_H + HEADER_FAMILY_GAP;
  let primitiveBandHeight = 0;

  for (const collection of system.collections) {
    const families = familiesByCollection(system, collection.id);
    let cursorY = firstFamilyY;
    for (const _family of families) {
      cursorY += PRIMITIVE_FAMILY_H + FAMILY_GAP;
    }
    const cardHeight =
      (families.length > 0 ? cursorY - FAMILY_GAP : COLLECTION_HEADER_H) + CARD_PADDING;
    primitiveBandHeight = Math.max(primitiveBandHeight, cardHeight);
  }

  return primitiveBandHeight;
}

function connectorGutterY(system: ColorSystem): number {
  return computePrimitiveBandHeight(system) + SEMANTIC_BAND_GAP / 2;
}

function semanticSubGroupInnerMax() {
  return SEMANTIC_SUBGROUP_MAX_W - CARD_PADDING * 2;
}

function measureSemanticCollectionCard(
  system: ColorSystem,
  collectionId: string,
): { width: number; height: number } {
  const firstSubFamilyY = SUB_GROUP_HEADER_H + HEADER_FAMILY_GAP;
  const innerMax = semanticSubGroupInnerMax();
  let cursorX = CARD_PADDING;
  let maxSubGroupH = 0;

  for (const subGroupId of semanticSubGroupsForSurface(system, collectionId)) {
    const familyKeys = semanticFamilyKeysForSubGroup(system, collectionId, subGroupId);
    let innerY = firstSubFamilyY;
    const familyLayouts = familyKeys.map((familyKey) => {
      const roles = semanticTokenRolesForFamily(system, collectionId, familyKey);
      return { roles, contentW: semanticFamilyWidth(roles) };
    });
    const maxFamilyContentW = familyLayouts.reduce(
      (max, layout) => Math.max(max, layout.contentW),
      0,
    );
    const subGroupInnerW = Math.min(Math.max(maxFamilyContentW, 160), innerMax);

    for (const { roles } of familyLayouts) {
      innerY += semanticFamilyHeight(roles, subGroupInnerW) + FAMILY_GAP;
    }

    const subGroupH =
      (familyKeys.length > 0 ? innerY - FAMILY_GAP : SUB_GROUP_HEADER_H) + CARD_PADDING;
    maxSubGroupH = Math.max(maxSubGroupH, subGroupH);
    cursorX += subGroupInnerW + CARD_PADDING * 2 + SUB_GROUP_GAP_X;
  }

  const cardWidth =
    (cursorX > CARD_PADDING ? cursorX - SUB_GROUP_GAP_X : 0) + CARD_PADDING;
  const cardHeight =
    (maxSubGroupH > 0 ? firstSubFamilyY + maxSubGroupH : COLLECTION_HEADER_H) +
    CARD_PADDING;

  return {
    width: Math.max(cardWidth, 220),
    height: cardHeight,
  };
}

function computeScratchSpawnPosition(
  system: ColorSystem,
  spawnIndex: number,
): { x: number; y: number } {
  const semanticY = computePrimitiveBandHeight(system) + SEMANTIC_BAND_GAP;
  let maxWidth = 0;
  let cursorY = semanticY;

  for (const collection of system.semanticCollections) {
    const { width, height } = measureSemanticCollectionCard(system, collection.id);
    maxWidth = Math.max(maxWidth, width);
    cursorY += height + COLLECTION_GAP_X;
  }

  const offset = spawnIndex * 24;
  return {
    x: maxWidth + SCRATCH_SPAWN_OFFSET_X + offset,
    y: semanticY + offset,
  };
}

function semanticChipWidth(role: string): number {
  return (
    SEMANTIC_CHIP_X_PAD * 2 +
    SEMANTIC_CHIP_SWATCH +
    SEMANTIC_CHIP_INNER_GAP +
    role.length * SEMANTIC_CHIP_CHAR_W
  );
}

function semanticFamilyWidth(roles: string[]): number {
  if (roles.length === 0) return 120;
  const chipWidths = roles.map(semanticChipWidth);
  return (
    SEMANTIC_SURFACE_GROUP_H_PAD +
    chipWidths.reduce((sum, width) => sum + width, 0) +
    Math.max(roles.length - 1, 0) * SEMANTIC_CHIP_GAP
  );
}

function semanticChipRowCount(roles: string[], chipAreaWidth: number): number {
  if (roles.length === 0) return 1;
  let rows = 1;
  let rowWidth = 0;
  for (const role of roles) {
    const chipWidth = semanticChipWidth(role);
    const nextWidth =
      rowWidth === 0 ? chipWidth : rowWidth + SEMANTIC_CHIP_GAP + chipWidth;
    if (nextWidth > chipAreaWidth && rowWidth > 0) {
      rows += 1;
      rowWidth = chipWidth;
    } else {
      rowWidth = nextWidth;
    }
  }
  return rows;
}

function semanticFamilyHeight(roles: string[], familyWidth: number): number {
  const chipAreaWidth = Math.max(
    familyWidth - SEMANTIC_SURFACE_GROUP_H_PAD,
    semanticChipWidth(roles[0] ?? "x"),
  );
  const rowCount = semanticChipRowCount(roles, chipAreaWidth);
  const chipAreaHeight =
    rowCount * SEMANTIC_CHIP_H + Math.max(rowCount - 1, 0) * SEMANTIC_CHIP_GAP;
  return (
    SEMANTIC_FAMILY_HEADER_H +
    SEMANTIC_FAMILY_BODY_V_PAD +
    chipAreaHeight +
    SEMANTIC_FAMILY_HEIGHT_BUFFER
  );
}

function semanticNodeId(surface: string, familyKey: string) {
  return `sem-${semanticFamilySlotId(surface, familyKey)}`;
}

function semanticSubGroupNodeId(surface: string, subGroupId: string) {
  return `semgrp-${semanticSubGroupSlotId(surface, subGroupId)}`;
}

function primitiveFamilyWidth(stepCount: number): number {
  const count = Math.max(stepCount, 1);
  return (
    SWATCH_GRID_PADDING * 2 + count * SWATCH_CELL_W + Math.max(count - 1, 0) * SWATCH_GAP
  );
}

function estimatePrimitiveHeight(_stepCount: number) {
  return PRIMITIVE_FAMILY_H;
}

export function ColorSandboxPage() {
  const { brandTheme, setBrandTheme, theme, setTheme } = useTheme();
  const [system, setSystem] = useState<ColorSystem>(() =>
    loadColorSandboxSystem(brandTheme),
  );
  const [applyRuntime, setApplyRuntime] = useState(() => readColorSandboxApplyRuntime());
  const [readOnly, setReadOnly] = useState(() => readColorSandboxReadOnly());
  const [selection, setSelection] = useState<Selection>(null);
  const [exported, setExported] = useState(false);
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
  const [canvasTool, setCanvasTool] = useState<ScratchCanvasTool>("select");
  const isGrabTool = canvasTool === "grab";
  const clearScratchSelectionRef = useRef<() => void>(() => {});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const steps = useMemo(() => stepIndex(system), [system]);
  const stepFamily = useMemo(() => familyOfStep(system), [system]);

  const semanticFamilyColor = useMemo(() => {
    const map = new Map<string, string>();
    for (const family of system.semanticFamilies) {
      const key = family.id;
      const primaryBg = system.semantics.find(
        (token) =>
          token.familyKey === key &&
          token.surface === "background" &&
          token.role.includes("primary"),
      );
      const token =
        primaryBg ?? system.semantics.find((item) => item.familyKey === key);
      map.set(key, token ? semanticHex(system, token, theme, steps) : "#69788A");
    }
    return map;
  }, [system, theme, steps]);

  const cardChromeStyle = useMemo((): CSSProperties & Record<string, string> => ({
    "--sandbox-bg-neutral-primary": cssColor(
      neutralBackgroundHex(system, "primary", theme, steps),
    ),
    "--sandbox-bg-neutral-secondary": cssColor(
      neutralBackgroundHex(system, "secondary", theme, steps),
    ),
    "--sandbox-border-neutral-primary": cssColor(
      neutralBorderHex(system, "primary", theme, steps),
    ),
    "--sandbox-border-neutral-strong": cssColor(
      neutralBorderHex(system, "strong", theme, steps),
    ),
  }), [system, theme, steps]);

  const primitiveOptions = useMemo(
    () =>
      system.families.flatMap((family) =>
        family.steps.map((step) => ({
          value: step.id,
          label: `${family.name}-${step.step} (${step.hex})`,
        })),
      ),
    [system],
  );

  const persist = useCallback(
    (next: ColorSystem) => {
      persistColorSandboxDoc(brandTheme, next);
      if (readColorSandboxApplyRuntime()) {
        notifyColorSandboxUpdated();
      }
    },
    [brandTheme],
  );

  const applyChange = useCallback(
    (next: ColorSystem) => {
      if (readOnly) return;
      setSystem(next);
      persist(next);
    },
    [persist, readOnly],
  );

  const toggleReadOnly = useCallback(() => {
    setReadOnly((current) => {
      const next = !current;
      setColorSandboxReadOnly(next);
      if (next) clearScratchSelectionRef.current();
      return next;
    });
  }, []);

  // Codified comments: the ones bundled with the committed baseline. Anything
  // else on the working draft is a session comment.
  const codifiedComments = useMemo(() => {
    const baseline =
      brandTheme === "codeAi" ? buildCodeAiColorSystem() : buildColorSystem();
    const map = new Map<string, string>();
    for (const token of baseline.semantics) {
      for (const mode of ["light", "dark"] as ThemeKey[]) {
        const comment = token.comments?.[mode];
        if (comment) map.set(`${token.id}::${mode}`, comment);
      }
    }
    return map;
  }, [brandTheme]);

  const toggleApplyRuntime = useCallback((enabled: boolean) => {
    setApplyRuntime(enabled);
    setColorSandboxRuntimePreview(enabled);
    notifyColorSandboxUpdated();
  }, []);

  const selectStep = useCallback(
    (id: string) => {
      clearScratchSelectionRef.current();
      setSelection({ kind: "step", id });
    },
    [],
  );
  const selectFamily = useCallback(
    (id: string) => {
      clearScratchSelectionRef.current();
      setSelection({ kind: "family", id });
    },
    [],
  );
  const selectCollection = useCallback(
    (id: string) => {
      clearScratchSelectionRef.current();
      setSelection({ kind: "collection", id });
    },
    [],
  );
  const selectSemantic = useCallback(
    (id: string) => {
      const token = system.semantics.find((item) => item.id === id);
      if (!token) return;
      clearScratchSelectionRef.current();
      setSelection({
        kind: "semantic",
        surface: token.surface,
        familyKey: token.familyKey,
        role: token.role,
      });
    },
    [system],
  );
  const selectSemanticFamily = useCallback(
    (id: string, surface: string) => {
      clearScratchSelectionRef.current();
      setSelection({ kind: "semanticFamily", id, surface });
    },
    [],
  );
  const selectSemanticCollection = useCallback(
    (id: string) => {
      clearScratchSelectionRef.current();
      setSelection({ kind: "semanticCollection", id });
    },
    [],
  );
  const selectSemanticSubGroup = useCallback(
    (surface: string, id: string) => {
      clearScratchSelectionRef.current();
      setSelection({ kind: "semanticSubGroup", id, surface });
    },
    [],
  );

  const buildCollectionData = useCallback(
    (
      collectionId: string,
      kind: "primitive" | "semantic",
    ): CollectionNodeData => {
      const collection =
        kind === "primitive"
          ? system.collections.find((item) => item.id === collectionId)!
          : system.semanticCollections.find((item) => item.id === collectionId)!;
      const familyCount =
        kind === "primitive"
          ? familiesByCollection(system, collectionId).length
          : semanticFamilyKeysForSurface(system, collectionId).length;
      const selected =
        kind === "primitive"
          ? selection?.kind === "collection" && selection.id === collectionId
          : selection?.kind === "semanticCollection" &&
            selection.id === collectionId;
      return {
        collectionId,
        name: collection.name,
        familyCount,
        selected,
        dropId:
          kind === "primitive"
            ? `prim-collection:${collectionId}`
            : `sem-collection:${collectionId}`,
        dropKind: kind === "primitive" ? "primitiveCollection" : "semanticCollection",
        onSelect:
          kind === "primitive" ? selectCollection : selectSemanticCollection,
      };
    },
    [system, selection, selectCollection, selectSemanticCollection],
  );

  const buildPrimitiveData = useCallback(
    (familyId: string): PrimitiveNodeData => {
      const family = system.families.find((item) => item.id === familyId)!;
      const collection = system.collections.find(
        (item) => item.id === family.collectionId,
      );
      return {
        familyId,
        collectionId: family.collectionId,
        name: family.name,
        collectionName: collection?.name ?? family.collectionId,
        color: familyMidHex(family),
        dragId: `prim-family:${familyId}`,
        familySelected: selection?.kind === "family" && selection.id === familyId,
        selectedStepId: selection?.kind === "step" ? selection.id : null,
        onSelectStep: selectStep,
        onSelectFamily: selectFamily,
        swatches: sortPrimitiveSteps(family.steps).map((step) => ({
          id: step.id,
          step: step.step,
          hex: step.hex,
        })),
      };
    },
    [system, selection, selectStep, selectFamily],
  );

  const buildSemanticData = useCallback(
    (surface: string, familyKey: string): SemanticNodeData => {
      const chips = semanticTokensForFamily(system, surface, familyKey).map((token) => ({
        id: token.id,
        surface: token.surface,
        role: token.role,
        hex: semanticHex(system, token, theme, steps),
        mapped: token.ref[theme] != null,
        hasComment: Boolean(token.comments?.[theme]),
        dragId: `sem-chip:${semanticFamilySlotId(surface, familyKey)}:${token.role}`,
      }));
      return {
        familyKey,
        surface,
        subGroupId: semanticSubGroupForFamily(system, familyKey),
        label: semanticFamilyLabel(system, familyKey),
        color: semanticFamilyColor.get(familyKey) ?? "#69788A",
        dragId: `sem-family:${semanticFamilySlotId(surface, familyKey)}`,
        chips,
        selectedRole:
          selection?.kind === "semantic" &&
          selection.surface === surface &&
          selection.familyKey === familyKey
            ? selection.role
            : null,
        familySelected:
          selection?.kind === "semanticFamily" &&
          selection.id === familyKey &&
          selection.surface === surface,
        onSelect: selectSemantic,
        onSelectFamily: selectSemanticFamily,
      };
    },
    [
      system,
      theme,
      steps,
      semanticFamilyColor,
      selection,
      selectSemantic,
      selectSemanticFamily,
    ],
  );

  const buildSubGroupData = useCallback(
    (surface: string, subGroupId: string): SemanticSubGroupNodeData => {
      const subGroup = system.semanticSubGroups.find((item) => item.id === subGroupId)!;
      const familyCount = semanticFamilyKeysForSubGroup(system, surface, subGroupId).length;
      return {
        subGroupId,
        surface,
        name: subGroup.name,
        familyCount,
        dropId: `sem-subgroup:${semanticSubGroupSlotId(surface, subGroupId)}`,
        selected:
          selection?.kind === "semanticSubGroup" &&
          selection.surface === surface &&
          selection.id === subGroupId,
        onSelect: selectSemanticSubGroup,
      };
    },
    [system, selection, selectSemanticSubGroup],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const signatureRef = useRef<string>("");

  // ── Scratch layer: free-positioned swatch/text nodes (persist per brand,
  // shared across light/dark). Managed independently from the collection nodes.
  const [scratchNodes, setScratchNodes, onScratchNodesChange] =
    useNodesState<ScratchFlowNode>(
      loadScratchNodes(brandTheme).map(toScratchFlowNode),
    );
  const scratchNodesRef = useRef(scratchNodes);
  scratchNodesRef.current = scratchNodes;
  const scratchOrderRef = useRef<string[]>([]);
  const scratchBrandRef = useRef<BrandTheme>(brandTheme);
  const lastLoadedScratchRef = useRef<ScratchFlowNode[] | null>(null);
  const flowRef = useRef<ReactFlowInstance<Node, Edge> | null>(null);
  const spawnCountRef = useRef(0);

  const selectedScratch = useMemo(
    () => scratchNodes.filter((node) => node.selected),
    [scratchNodes],
  );
  const hasSelectedScratch = selectedScratch.length > 0;
  const hasSelectedScratchRef = useRef(false);
  hasSelectedScratchRef.current = hasSelectedScratch;

  const clearScratchSelection = useCallback(() => {
    scratchOrderRef.current = [];
    setScratchNodes((current) =>
      current.some((node) => node.selected)
        ? current.map((node) =>
            node.selected ? { ...node, selected: false } : node,
          )
        : current,
    );
  }, [setScratchNodes]);
  clearScratchSelectionRef.current = clearScratchSelection;

  const handleCanvasToolChange = useCallback(
    (tool: ScratchCanvasTool) => {
      setCanvasTool(tool);
      if (tool === "grab") {
        setSelection(null);
        clearScratchSelection();
      }
    },
    [clearScratchSelection],
  );

  const flowNodes = useMemo<Node[]>(() => {
    // Scratch nodes sit visually beside the collections, but must not intercept
    // clicks meant for collection cards — keep system nodes above scratch in z-order.
    const scratch = scratchNodes.map((node, index) => ({
      ...node,
      zIndex: index,
      draggable: !isGrabTool && !readOnly,
      selectable: !isGrabTool && !readOnly,
      className: isGrabTool ? undefined : "nopan",
    }));
    const collections = nodes.map((node) => ({
      ...node,
      zIndex: 1000,
    }));
    return [...scratch, ...collections];
  }, [nodes, scratchNodes, isGrabTool, readOnly]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      const scratchChanges: NodeChange<Node>[] = [];
      const otherChanges: NodeChange<Node>[] = [];
      for (const change of changes) {
        if ("id" in change && isScratchId(change.id)) scratchChanges.push(change);
        else otherChanges.push(change);
      }

      if (otherChanges.length > 0) onNodesChange(otherChanges);
      if (scratchChanges.length === 0) return;

      onScratchNodesChange(scratchChanges as NodeChange<ScratchFlowNode>[]);

      let selectedSomething = false;
      for (const change of scratchChanges) {
        if (change.type !== "select") continue;
        if (change.selected) {
          selectedSomething = true;
          scratchOrderRef.current = [
            ...scratchOrderRef.current.filter((id) => id !== change.id),
            change.id,
          ];
        } else {
          scratchOrderRef.current = scratchOrderRef.current.filter(
            (id) => id !== change.id,
          );
        }
      }

      if (selectedSomething) setSelection(null);
    },
    [onNodesChange, onScratchNodesChange, setScratchNodes],
  );

  const updateScratchNodeData = useCallback(
    (id: string, partial: Partial<ScratchNodeData>) => {
      setScratchNodes((current) =>
        current.map((node) => {
          if (node.id !== id) return node;
          const nextData = { ...node.data, ...partial };
          if (nextData.kind !== "text" || partial.text === undefined) {
            return { ...node, data: nextData };
          }
          const width = measureScratchTextWidth(nextData.text);
          return {
            ...node,
            width,
            style: { ...node.style, width, height: node.height },
            data: nextData,
          };
        }),
      );
    },
    [setScratchNodes],
  );

  const updateScratchFill = useCallback(
    (id: string, hex: string) => updateScratchNodeData(id, { fill: rgbHex(hex) }),
    [updateScratchNodeData],
  );

  const updateScratchBorder = useCallback(
    (id: string, hex: string) =>
      updateScratchNodeData(id, { border: hex.trim().length > 0 ? rgbHex(hex) : "" }),
    [updateScratchNodeData],
  );

  const addScratchNode = useCallback(
    (kind: ScratchNodeKind) => {
      const spawnIndex = spawnCountRef.current;
      spawnCountRef.current = (spawnCountRef.current + 1) % 8;
      const position = computeScratchSpawnPosition(system, spawnIndex);
      const fill =
        kind === "swatch"
          ? SCRATCH_DEFAULT_SWATCH_FILL
          : SCRATCH_DEFAULT_TEXT_FILL;
      const node = toScratchFlowNode(createScratchNode(kind, fill, position));
      node.selected = true;
      scratchOrderRef.current = [node.id];
      setSelection(null);
      setScratchNodes((current) => [
        ...current.map((item) =>
          item.selected ? { ...item, selected: false } : item,
        ),
        node,
      ]);
    },
    [setScratchNodes, system],
  );

  const duplicateScratch = useCallback(() => {
    setScratchNodes((current) => {
      const selectedIds = current
        .filter((node) => node.selected)
        .map((node) => node.id);
      if (selectedIds.length === 0) return current;
      const clones: ScratchFlowNode[] = [];
      for (const node of current) {
        if (!node.selected) continue;
        const clone = toScratchFlowNode({
          ...fromScratchFlowNode(node),
          id: `scratch:${Date.now().toString(36)}${Math.random()
            .toString(36)
            .slice(2, 7)}${clones.length}`,
          x: node.position.x + 24,
          y: node.position.y + 24,
        });
        clone.selected = true;
        clones.push(clone);
      }
      scratchOrderRef.current = clones.slice(-2).map((clone) => clone.id);
      return [
        ...current.map((node) =>
          node.selected ? { ...node, selected: false } : node,
        ),
        ...clones,
      ];
    });
  }, [setScratchNodes]);

  const bringScratchToFront = useCallback(() => {
    setScratchNodes((current) => {
      const selected = current.filter((node) => node.selected);
      if (selected.length === 0) return current;
      return [...current.filter((node) => !node.selected), ...selected];
    });
  }, [setScratchNodes]);

  const sendScratchToBack = useCallback(() => {
    setScratchNodes((current) => {
      const selected = current.filter((node) => node.selected);
      if (selected.length === 0) return current;
      return [...selected, ...current.filter((node) => !node.selected)];
    });
  }, [setScratchNodes]);

  const deleteScratch = useCallback(() => {
    scratchOrderRef.current = [];
    setScratchNodes((current) => current.filter((node) => !node.selected));
  }, [setScratchNodes]);

  const syncScratchTextWidth = useCallback(
    (id: string, text: string) => {
      const width = measureScratchTextWidth(text);
      setScratchNodes((current) =>
        current.map((node) => {
          if (node.id !== id || node.data.kind !== "text") return node;
          if (node.width === width) return node;
          return {
            ...node,
            width,
            style: { ...node.style, width, height: node.height },
          };
        }),
      );
    },
    [setScratchNodes],
  );

  const scratchActions = useMemo(
    () => ({ updateScratchNode: updateScratchNodeData, syncScratchTextWidth }),
    [updateScratchNodeData, syncScratchTextWidth],
  );

  const buildAllNodes = useCallback((): Node[] => {
    const result: Node[] = [];
    const firstFamilyY = COLLECTION_HEADER_H + HEADER_FAMILY_GAP;
    let collectionX = 0;

    for (const collection of system.collections) {
      const collectionNodeId = `col-${collection.id}`;
      const families = familiesByCollection(system, collection.id);

      const childNodes: Node[] = [];
      let cursorY = firstFamilyY;
      let maxFamilyW = 0;
      for (const family of families) {
        maxFamilyW = Math.max(maxFamilyW, primitiveFamilyWidth(family.steps.length));
      }
      const familyW = Math.max(maxFamilyW, 180);
      for (const family of families) {
        childNodes.push({
          ...REACT_FLOW_NO_PAN,
          id: `prim-${family.id}`,
          type: "primitiveFamily",
          parentId: collectionNodeId,
          extent: "parent",
          position: { x: CARD_PADDING, y: cursorY },
          style: { width: familyW },
          data: buildPrimitiveData(family.id),
        });
        cursorY += PRIMITIVE_FAMILY_H + FAMILY_GAP;
      }

      const cardWidth = (families.length > 0 ? familyW : 0) + CARD_PADDING * 2;
      const cardHeight =
        (families.length > 0 ? cursorY - FAMILY_GAP : COLLECTION_HEADER_H) + CARD_PADDING;

      result.push({
        ...REACT_FLOW_NO_PAN,
        id: collectionNodeId,
        type: "collectionHeader",
        position: { x: collectionX, y: 0 },
        data: buildCollectionData(collection.id, "primitive"),
        style: { width: Math.max(cardWidth, 220), height: cardHeight },
      });
      result.push(...childNodes);

      collectionX += Math.max(cardWidth, 220) + COLLECTION_GAP_X;
    }

    const semanticY = computePrimitiveBandHeight(system) + SEMANTIC_BAND_GAP;
    let semanticCollectionY = semanticY;
    const semanticCollectionX = 0;

    for (const collection of system.semanticCollections) {
      const collectionNodeId = `semcol-${collection.id}`;
      const childNodes: Node[] = [];
      const firstSubFamilyY = SUB_GROUP_HEADER_H + HEADER_FAMILY_GAP;
      const innerMax = semanticSubGroupInnerMax();
      let cursorX = CARD_PADDING;
      let maxSubGroupH = 0;

      for (const subGroupId of semanticSubGroupsForSurface(system, collection.id)) {
        const subGroupNodeId = semanticSubGroupNodeId(collection.id, subGroupId);
        const familyKeys = semanticFamilyKeysForSubGroup(
          system,
          collection.id,
          subGroupId,
        );

        let innerY = firstSubFamilyY;
        const familyLayouts = familyKeys.map((familyKey) => {
          const roles = semanticTokenRolesForFamily(system, collection.id, familyKey);
          return { familyKey, roles, contentW: semanticFamilyWidth(roles) };
        });
        const maxFamilyContentW = familyLayouts.reduce(
          (max, layout) => Math.max(max, layout.contentW),
          0,
        );
        const subGroupInnerW = Math.min(Math.max(maxFamilyContentW, 160), innerMax);
        const subGroupChildren: Node[] = [];

        for (const { familyKey, roles } of familyLayouts) {
          const familyW = subGroupInnerW;
          const familyH = semanticFamilyHeight(roles, familyW);
          subGroupChildren.push({
            ...REACT_FLOW_NO_PAN,
            id: semanticNodeId(collection.id, familyKey),
            type: "semanticFamily",
            parentId: subGroupNodeId,
            extent: "parent",
            position: { x: CARD_PADDING, y: innerY },
            style: { width: familyW, height: familyH },
            data: buildSemanticData(collection.id, familyKey),
          });
          innerY += familyH + FAMILY_GAP;
        }

        const subGroupW = subGroupInnerW + CARD_PADDING * 2;
        const subGroupH =
          (familyKeys.length > 0 ? innerY - FAMILY_GAP : SUB_GROUP_HEADER_H) +
          CARD_PADDING;
        maxSubGroupH = Math.max(maxSubGroupH, subGroupH);

        childNodes.push({
          ...REACT_FLOW_NO_PAN,
          id: subGroupNodeId,
          type: "semanticSubGroup",
          parentId: collectionNodeId,
          extent: "parent",
          position: { x: cursorX, y: firstSubFamilyY },
          style: { width: subGroupW, height: subGroupH },
          data: buildSubGroupData(collection.id, subGroupId),
        });
        childNodes.push(...subGroupChildren);
        cursorX += subGroupW + SUB_GROUP_GAP_X;
      }

      const { width: cardWidth, height: cardHeight } = measureSemanticCollectionCard(
        system,
        collection.id,
      );

      result.push({
        ...REACT_FLOW_NO_PAN,
        id: collectionNodeId,
        type: "collectionHeader",
        position: { x: semanticCollectionX, y: semanticCollectionY },
        data: buildCollectionData(collection.id, "semantic"),
        style: { width: cardWidth, height: cardHeight },
      });
      result.push(...childNodes);

      semanticCollectionY += cardHeight + COLLECTION_GAP_X;
    }

    return result;
  }, [system, buildCollectionData, buildPrimitiveData, buildSemanticData, buildSubGroupData]);

  useEffect(() => {
    const signature = layoutSignature(system);
    if (signature !== signatureRef.current) {
      signatureRef.current = signature;
      setNodes(buildAllNodes());
      return;
    }
    setNodes((current) =>
      current.map((node) => {
        if (node.type === "collectionHeader") {
          if (node.id.startsWith("semcol-")) {
            return {
              ...node,
              data: buildCollectionData(node.id.replace("semcol-", ""), "semantic"),
            };
          }
          return {
            ...node,
            data: buildCollectionData(node.id.replace("col-", ""), "primitive"),
          };
        }
        if (node.type === "semanticSubGroup") {
          const { surface, subGroupId } = parseSemanticSubGroupSlotId(
            node.id.replace("semgrp-", ""),
          );
          return { ...node, data: buildSubGroupData(surface, subGroupId) };
        }
        if (node.type === "primitiveFamily") {
          return { ...node, data: buildPrimitiveData(node.id.replace("prim-", "")) };
        }
        const { surface, familyKey } = parseSemanticFamilySlotId(
          node.id.replace("sem-", ""),
        );
        return { ...node, data: buildSemanticData(surface, familyKey) };
      }),
    );
  }, [
    system,
    theme,
    selection,
    setNodes,
    buildAllNodes,
    buildCollectionData,
    buildPrimitiveData,
    buildSubGroupData,
    buildSemanticData,
  ]);

  const edges = useMemo<Edge[]>(() => {
    if (!selection) return [];

    const selectedSemantic =
      selection.kind === "semantic"
        ? findSemanticToken(
            system,
            selection.surface,
            selection.familyKey,
            selection.role,
          )
        : undefined;

    const gutterY = connectorGutterY(system);
    const result: Edge[] = [];

    for (const token of system.semantics) {
      const refId = token.ref[theme];
      if (!refId) continue;
      const family = stepFamily.get(refId);
      if (!family) continue;

      let isActive = false;
      switch (selection.kind) {
        case "family":
          isActive = family.id === selection.id;
          break;
        case "step":
          isActive = refId === selection.id;
          break;
        case "collection":
          isActive = family.collectionId === selection.id;
          break;
        case "semantic":
          isActive = selectedSemantic
            ? token.surface === selectedSemantic.surface &&
              token.familyKey === selectedSemantic.familyKey &&
              token.role === selectedSemantic.role
            : false;
          break;
        case "semanticFamily":
          isActive =
            token.surface === selection.surface && token.familyKey === selection.id;
          break;
        case "semanticSubGroup":
          isActive =
            token.surface === selection.surface &&
            semanticSubGroupForFamily(system, token.familyKey) === selection.id;
          break;
        case "semanticCollection":
          isActive = token.surface === selection.id;
          break;
      }

      if (!isActive) continue;

      result.push({
        id: `${refId}->${token.surface}/${token.familyKey}/${token.role}`,
        type: "gutter",
        source: `prim-${family.id}`,
        sourceHandle: refId,
        target: semanticNodeId(token.surface, token.familyKey),
        targetHandle: token.role,
        data: { gutterY },
        style: {
          stroke: EDGE_COLOR,
          strokeWidth: EDGE_WIDTH,
          opacity: 0.9,
        },
      });
    }
    return result;
  }, [system, theme, selection, stepFamily]);

  // Load the working document whenever the brand changes.
  useLayoutEffect(() => {
    setSystem(loadColorSandboxSystem(brandTheme));
    setSelection(null);
    signatureRef.current = "";
  }, [brandTheme]);

  // Scratch nodes are scoped per brand; reload them on brand switch.
  useLayoutEffect(() => {
    const previousBrand = scratchBrandRef.current;
    if (previousBrand !== brandTheme) {
      // Flush the outgoing brand before loading the next — the persist effect can
      // otherwise run with the new brand key and stale in-memory nodes.
      persistScratchNodes(
        previousBrand,
        scratchNodesRef.current.map(fromScratchFlowNode),
      );
    }
    scratchBrandRef.current = brandTheme;
    scratchOrderRef.current = [];
    const loaded = loadScratchNodes(brandTheme).map(toScratchFlowNode);
    lastLoadedScratchRef.current = loaded;
    setScratchNodes(loaded);
  }, [brandTheme, setScratchNodes]);

  // Persist scratch nodes for the current brand (shared across light/dark).
  useEffect(() => {
    if (scratchNodes === lastLoadedScratchRef.current) return;
    persistScratchNodes(
      scratchBrandRef.current,
      scratchNodes.map(fromScratchFlowNode),
    );
  }, [scratchNodes]);

  // Selecting a color collection element clears any scratch selection.
  useEffect(() => {
    if (selection) clearScratchSelection();
  }, [selection, clearScratchSelection]);

  // Delete/Backspace removes the selected scratch nodes (never while editing text).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (!hasSelectedScratchRef.current) return;
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      deleteScratch();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteScratch]);

  function resetDraft() {
    const fresh =
      brandTheme === "codeAi" ? buildCodeAiColorSystem() : buildColorSystem();
    setSelection(null);
    signatureRef.current = "";
    applyChange(fresh);
  }

  function downloadFile(filename: string, contents: string, type: string) {
    const blob = new Blob([contents], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function downloadExport() {
    downloadFile(
      "primitiveColors.css",
      buildPrimitiveColorsCss(system),
      "text/css;charset=utf-8",
    );
    downloadFile(
      "colors.css",
      buildSemanticColorsCss(system),
      "text/css;charset=utf-8",
    );
    setExported(true);
    window.setTimeout(() => setExported(false), 1600);
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as
      | { kind: "primitiveFamily"; familyId: string }
      | { kind: "semanticFamily"; familyKey: string; surface: string }
      | { kind: "semanticChip"; familyKey: string; surface: string; role: string }
      | undefined;
    if (data?.kind === "primitiveFamily") {
      const family = system.families.find((item) => item.id === data.familyId);
      setActiveDragLabel(family?.name ?? "Family");
      return;
    }
    if (data?.kind === "semanticFamily") {
      setActiveDragLabel(semanticFamilyLabel(system, data.familyKey));
      return;
    }
    if (data?.kind === "semanticChip") {
      setActiveDragLabel(data.role);
    }
  }, [system]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragLabel(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeData = active.data.current as
        | { kind: "primitiveFamily"; familyId: string; collectionId: string }
        | { kind: "semanticFamily"; familyKey: string; surface: string; subGroupId: string }
        | { kind: "semanticChip"; familyKey: string; surface: string; role: string }
        | undefined;
      const overData = over.data.current as
        | { kind: "primitiveFamily"; familyId: string; collectionId: string }
        | { kind: "semanticFamily"; familyKey: string; surface: string; subGroupId: string }
        | { kind: "semanticChip"; familyKey: string; surface: string; role: string }
        | { kind: "primitiveCollection"; collectionId: string }
        | { kind: "semanticCollection"; collectionId: string }
        | { kind: "semanticSubGroup"; surface: string; subGroupId: string }
        | undefined;

      if (!activeData || !overData) return;

      if (activeData.kind === "semanticChip") {
        if (
          overData.kind === "semanticChip" &&
          activeData.surface === overData.surface &&
          activeData.familyKey === overData.familyKey
        ) {
          const next = reorderSemanticTokenInFamily(
            system,
            activeData.surface,
            activeData.familyKey,
            activeData.role,
            overData.role,
          );
          if (next !== system) applyChange(next);
        }
        return;
      }

      if (activeData.kind === "primitiveFamily") {
        if (overData.kind === "primitiveFamily") {
          if (activeData.collectionId === overData.collectionId) {
            const next = reorderPrimitiveFamilyInCollection(
              system,
              activeData.collectionId,
              activeData.familyId,
              overData.familyId,
            );
            if (next !== system) applyChange(next);
            return;
          }

          const sourceFamily = system.families.find(
            (item) => item.id === activeData.familyId,
          );
          if (!sourceFamily) return;

          let next = movePrimitiveFamily(
            system,
            activeData.familyId,
            overData.collectionId,
          );
          const moved = next.families.find(
            (item) =>
              item.collectionId === overData.collectionId &&
              item.name === sourceFamily.name,
          );
          if (!moved) return;

          next = reorderPrimitiveFamilyInCollection(
            next,
            overData.collectionId,
            moved.id,
            overData.familyId,
          );
          applyChange(next);
          setSelection({ kind: "family", id: moved.id });
          return;
        }

        if (overData.kind === "primitiveCollection") {
          const family = system.families.find((item) => item.id === activeData.familyId);
          if (!family || family.collectionId === overData.collectionId) return;
          const next = movePrimitiveFamily(
            system,
            activeData.familyId,
            overData.collectionId,
          );
          const moved = next.families.find(
            (item) =>
              item.collectionId === overData.collectionId &&
              item.name === family.name,
          );
          applyChange(next);
          if (moved) setSelection({ kind: "family", id: moved.id });
        }
        return;
      }

      if (activeData.kind === "semanticFamily") {
        if (overData.kind === "semanticFamily") {
          if (
            activeData.surface === overData.surface &&
            activeData.subGroupId === overData.subGroupId
          ) {
            const next = reorderSemanticFamilyInSubGroup(
              system,
              activeData.surface,
              activeData.subGroupId,
              activeData.familyKey,
              overData.familyKey,
            );
            if (next !== system) applyChange(next);
            return;
          }

          let next = system;
          if (activeData.surface !== overData.surface) {
            next = moveSemanticFamilyToSurface(
              next,
              activeData.familyKey,
              activeData.surface,
              overData.surface,
            );
          }
          if (semanticSubGroupForFamily(next, activeData.familyKey) !== overData.subGroupId) {
            next = moveSemanticFamilyToSubGroup(
              next,
              activeData.familyKey,
              overData.subGroupId,
            );
          }
          next = reorderSemanticFamilyInSubGroup(
            next,
            overData.surface,
            overData.subGroupId,
            activeData.familyKey,
            overData.familyKey,
          );
          if (next !== system) {
            applyChange(next);
            setSelection({
              kind: "semanticFamily",
              id: activeData.familyKey,
              surface: overData.surface,
            });
          }
          return;
        }

        if (
          overData.kind === "semanticSubGroup" &&
          overData.surface === activeData.surface
        ) {
          const next = moveSemanticFamilyToSubGroup(
            system,
            activeData.familyKey,
            overData.subGroupId,
          );
          if (next !== system) {
            applyChange(next);
            setSelection({
              kind: "semanticFamily",
              id: activeData.familyKey,
              surface: activeData.surface,
            });
          }
          return;
        }

        if (
          overData.kind === "semanticCollection" &&
          overData.collectionId !== activeData.surface
        ) {
          const next = moveSemanticFamilyToSurface(
            system,
            activeData.familyKey,
            activeData.surface,
            overData.collectionId,
          );
          if (next !== system) {
            applyChange(next);
            setSelection({
              kind: "semanticFamily",
              id: activeData.familyKey,
              surface: overData.collectionId,
            });
          }
        }
      }
    },
    [system, applyChange],
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragLabel(null);
  }, []);

  return (
    <div
      className={`${styles.page} ${theme === "dark" ? "dark" : ""}`}
      data-theme={theme}
      style={cardChromeStyle}
    >
      <DndContext
        sensors={readOnly ? [] : sensors}
        collisionDetection={colorSystemCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
      <ScratchActionsProvider value={scratchActions}>
      <ReactFlow
        className={`${styles.flow} ${isGrabTool ? styles.flowGrab : styles.flowSelect}`}
        nodes={flowNodes}
        edges={edges}
        nodeTypes={allNodeTypes}
        edgeTypes={colorSystemEdgeTypes}
        onNodesChange={handleNodesChange}
        onInit={(instance) => {
          flowRef.current = instance;
        }}
        onPaneClick={() => {
          setSelection(null);
          clearScratchSelection();
        }}
        nodesConnectable={false}
        nodesDraggable={!isGrabTool && !readOnly}
        elevateNodesOnSelect={false}
        multiSelectionKeyCode="Shift"
        selectionKeyCode={null}
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
        panOnDrag={isGrabTool || readOnly}
        selectionOnDrag={!isGrabTool && !readOnly}
        selectionMode={SelectionMode.Partial}
        zoomOnScroll={false}
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} />
        <Controls showInteractive={false}>
          <ControlButton
            onClick={toggleReadOnly}
            className={readOnly ? styles.canvasLockButtonActive : undefined}
            title={
              readOnly ? "Read-only — click to unlock editing" : "Editable — click to lock"
            }
            aria-label={readOnly ? "Unlock editing" : "Lock editing"}
            aria-pressed={readOnly}
          >
            <FaIcon name={readOnly ? "lock" : "lock-open"} size="s" />
          </ControlButton>
        </Controls>
        <MiniMap
          className={styles.minimap}
          style={{ width: 100, height: 100 }}
          pannable
          zoomable
          bgColor="var(--sandbox-bg-neutral-primary, var(--ds-background-neutral-primary))"
          nodeColor={(node) => {
            const data = node.data as
              | PrimitiveNodeData
              | SemanticNodeData
              | CollectionNodeData;
            return "color" in data ? (data.color as string) : "#69788A";
          }}
          maskColor="color-mix(in srgb, var(--sandbox-bg-neutral-primary, var(--ds-background-neutral-primary)) 70%, transparent)"
        />

        <Panel position="top-right" className={styles.toolbarPanel}>
          <div className={styles.toolbar}>
          <div className={styles.toolbarControls}>
            <div className={styles.control}>
              <span className={styles.controlLabel}>Brand</span>
              <AppNativeSelect
                value={brandTheme}
                onValueChange={(value) => setBrandTheme(value as BrandTheme)}
                options={BRAND_OPTIONS}
                size="s"
                tone="gray"
              />
            </div>
            <div className={styles.control}>
              <span className={styles.controlLabel}>Mode</span>
              <AppNativeSelect
                value={theme}
                onValueChange={(value) => setTheme(value as ThemeMode)}
                options={MODE_OPTIONS}
                size="s"
                tone="gray"
              />
            </div>
          </div>
          {readOnly ? null : (
          <>
          <div className={styles.toolbarInteractionSection}>
            <div className={`${styles.toolbarToolGroup} ${styles.toolbarCanvasTools}`}>
              <Tooltip content="Select" position="bottom">
                <AppButton
                  variant="secondary"
                  tone="gray"
                  size="s"
                  iconName="arrow-pointer"
                  className={
                    canvasTool === "select"
                      ? `${styles.toolbarIconButton} ${styles.toolbarToolActive}`
                      : styles.toolbarIconButton
                  }
                  aria-label="Select"
                  aria-pressed={canvasTool === "select"}
                  onClick={() => handleCanvasToolChange("select")}
                />
              </Tooltip>
              <Tooltip content="Hand tool" position="bottom">
                <AppButton
                  variant="secondary"
                  tone="gray"
                  size="s"
                  iconName="hand"
                  className={
                    canvasTool === "grab"
                      ? `${styles.toolbarIconButton} ${styles.toolbarToolActive}`
                      : styles.toolbarIconButton
                  }
                  aria-label="Hand tool"
                  aria-pressed={canvasTool === "grab"}
                  onClick={() => handleCanvasToolChange("grab")}
                />
              </Tooltip>
            </div>
            <div className={styles.toolbarToolDivider} role="separator" />
            <div className={`${styles.toolbarToolGroup} ${styles.toolbarCreateTools}`}>
              <Tooltip content="Swatch" position="bottom">
                <AppButton
                  variant="secondary"
                  tone="gray"
                  size="s"
                  iconName="square"
                  className={styles.toolbarLabeledButton}
                  aria-label="Add swatch"
                  onClick={() => addScratchNode("swatch")}
                >
                  Swatch
                </AppButton>
              </Tooltip>
              <Tooltip content="Text" position="bottom">
                <AppButton
                  variant="secondary"
                  tone="gray"
                  size="s"
                  iconName="font"
                  className={styles.toolbarLabeledButton}
                  aria-label="Add text"
                  onClick={() => addScratchNode("text")}
                >
                  Text
                </AppButton>
              </Tooltip>
            </div>
          </div>
          <div className={styles.toolbarPersistentRow}>
            <label className={styles.runtimePreviewToggle}>
              <AppCheckbox
                checkboxSize="s"
                checked={applyRuntime}
                onChange={(event) => toggleApplyRuntime(event.target.checked)}
              />
              <span className={styles.runtimePreviewLabel}>Apply to app</span>
            </label>
            <div className={styles.toolbarIconActions}>
              <Tooltip content="Reset draft" position="bottom">
                <AppButton
                  variant="secondary"
                  tone="gray"
                  size="xs"
                  iconName="rotate-left"
                  className={styles.toolbarIconButton}
                  onClick={resetDraft}
                  aria-label="Reset draft"
                />
              </Tooltip>
            </div>
          </div>
          </>
          )}
          <div className={styles.toolbarDivider} role="separator" />
          <div className={styles.toolbarExportRow}>
            <AppButton
              variant="primary"
              tone="purple"
              size="s"
              fullWidth
              iconName={exported ? "check" : "download"}
              className={styles.toolbarExportButton}
              onClick={downloadExport}
              aria-label={exported ? "Exported" : "Export CSS"}
            >
              Export CSS
            </AppButton>
          </div>
          </div>
        </Panel>

        {selection ? (
          <Panel position="bottom-right" className={styles.inspectorPanel}>
            <Inspector
              system={system}
              theme={theme}
              selection={selection}
              steps={steps}
              stepFamily={stepFamily}
              primitiveOptions={primitiveOptions}
              readOnly={readOnly}
              codifiedComments={codifiedComments}
              applyChange={applyChange}
              setSelection={setSelection}
              onClose={() => setSelection(null)}
            />
          </Panel>
        ) : null}

        {!selection && hasSelectedScratch ? (
          <Panel position="bottom-right" className={styles.inspectorPanel}>
            <ColorScratchToolbar
              nodes={selectedScratch}
              system={system}
              onUpdateFill={updateScratchFill}
              onUpdateBorder={updateScratchBorder}
              onDuplicate={duplicateScratch}
              onBringForward={bringScratchToFront}
              onSendToBack={sendScratchToBack}
              onDelete={deleteScratch}
              onClose={clearScratchSelection}
            />
          </Panel>
        ) : null}
      </ReactFlow>
      </ScratchActionsProvider>

      <DragOverlay dropAnimation={null}>
        {activeDragLabel ? (
          <div className={styles.dragOverlay}>{activeDragLabel}</div>
        ) : null}
      </DragOverlay>
      </DndContext>
    </div>
  );
}

function InspectorShell({
  label,
  onClose,
  children,
  actions,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.inspector}>
      <div className={styles.inspectorHeader}>
        <span className={styles.inspectorHeaderLabel}>{label}</span>
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
      <div className={styles.inspectorBody}>{children}</div>
      {actions ? (
        <div className={`${styles.inspectorSection} ${styles.inspectorSectionActions}`}>
          <div className={styles.inspectorActions}>{actions}</div>
        </div>
      ) : null}
    </div>
  );
}

function InspectorBodySection({ children }: { children: ReactNode }) {
  return <div className={styles.inspectorBodySection}>{children}</div>;
}

function ColorPreviewBar({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false);
  const unset = isUnsetPrimitiveHex(hex);
  const transparent = !unset && isTransparentColor(hex);
  const labelColor = unset
    ? "var(--ds-text-neutral-quaternary)"
    : readableTextOn(hex);
  const displayHex = unset ? "Unset" : hex;

  return (
    <div
      className={`${styles.colorPreviewBar} ${
        unset || transparent ? styles.colorPreviewBarAlpha : ""
      }`}
      style={unset || transparent ? undefined : { background: cssColor(hex) }}
    >
      {transparent ? (
        <span className={styles.colorPreviewBarFill} style={{ background: cssColor(hex) }} />
      ) : null}
      <span className={styles.colorPreviewBarHex} style={{ color: labelColor }}>
        {displayHex}
      </span>
      {unset ? null : (
        <Tooltip content={copied ? "Copied" : "Copy hex"} position="top">
          <button
            type="button"
            className={styles.inlineCopyButton}
            style={{ color: labelColor }}
            aria-label={copied ? "Copied" : "Copy hex code"}
            onClick={() => {
              void navigator.clipboard.writeText(hex).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              });
            }}
          >
            <FaIcon name={copied ? "check" : "clipboard"} size="xs" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

function VariableCopyBar({ cssVarReference }: { cssVarReference: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className={styles.variableCopyBar}>
      <code className={styles.variableCopyBarText}>{cssVarReference}</code>
      <Tooltip content={copied ? "Copied" : "Copy CSS variable"} position="top">
        <button
          type="button"
          className={styles.inlineCopyButton}
          aria-label={copied ? "Copied" : "Copy CSS variable"}
          onClick={() => {
            void navigator.clipboard.writeText(cssVarReference).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            });
          }}
        >
          <FaIcon name={copied ? "check" : "clipboard"} size="xs" />
        </button>
      </Tooltip>
    </div>
  );
}

function Inspector({
  system,
  theme,
  selection,
  steps,
  stepFamily,
  primitiveOptions,
  readOnly,
  codifiedComments,
  applyChange,
  setSelection,
  onClose,
}: {
  system: ColorSystem;
  theme: ThemeKey;
  selection: Exclude<Selection, null>;
  steps: ReturnType<typeof stepIndex>;
  stepFamily: ReturnType<typeof familyOfStep>;
  primitiveOptions: Array<{ value: string; label: string }>;
  readOnly: boolean;
  codifiedComments: Map<string, string>;
  applyChange: (next: ColorSystem) => void;
  setSelection: (selection: Selection) => void;
  onClose: () => void;
}) {
  /** Edit affordances are hidden entirely in read-only mode. */
  const editActions = (node: ReactNode): ReactNode => (readOnly ? undefined : node);
  if (selection.kind === "collection") {
    const collection = system.collections.find((item) => item.id === selection.id);
    if (!collection) return null;
    const families = familiesByCollection(system, collection.id);
    return (
      <InspectorShell
        label="Primitive collection"
        onClose={onClose}
        actions={editActions(
          <AppButton
            className={styles.inspectorActionDelete}
            variant="tertiary"
            tone="gray"
            size="xs"
            iconName="trash"
            onClick={() => {
              if (!window.confirm(`Delete collection "${collection.name}" and its families?`))
                return;
              applyChange(deleteCollection(system, collection.id));
              setSelection(null);
            }}
          >
            Delete collection
          </AppButton>,
        )}
      >
        <InspectorBodySection>
          <RenameField
            label="Collection name"
            value={collection.name}
            readOnly={readOnly}
            onCommit={(name) =>
              applyChange(renameCollection(system, collection.id, name))
            }
          />
        </InspectorBodySection>
        <InspectorBodySection>
          <div className={styles.inspectorStack}>
            <div className={styles.inspectorRowHeading}>
              <span className={styles.inspectorRowLabel}>Add family</span>
              <span className={styles.inspectorMeta}>
                {families.length} {families.length === 1 ? "family" : "families"}
              </span>
            </div>
            {readOnly ? null : (
              <AppButton
                variant="secondary"
                tone="black"
                size="xs"
                iconName="plus"
                onClick={() => {
                  const name = window.prompt("New primitive family name", "new-family");
                  if (!name) return;
                  const { system: next, familyId } = addFamily(system, collection.id, name, {
                    stepped: true,
                  });
                  applyChange(next);
                  setSelection({ kind: "family", id: familyId });
                }}
              >
                Add family
              </AppButton>
            )}
          </div>
        </InspectorBodySection>
      </InspectorShell>
    );
  }

  if (selection.kind === "semanticCollection") {
    const collection = system.semanticCollections.find(
      (item) => item.id === selection.id,
    );
    if (!collection) return null;
    const familyCount = semanticFamilyKeysForSurface(system, collection.id).length;
    const subGroupCount = semanticSubGroupsForSurface(system, collection.id).length;
    return (
      <InspectorShell
        label="Semantic collection"
        onClose={onClose}
      >
        <InspectorBodySection>
          <RenameField
            label="Collection name"
            value={collection.name}
            readOnly={readOnly}
            onCommit={(name) =>
              applyChange(renameSemanticCollection(system, collection.id, name))
            }
          />
        </InspectorBodySection>
        <InspectorBodySection>
          <p className={styles.inspectorMeta}>
            {subGroupCount} {subGroupCount === 1 ? "group" : "groups"} · {familyCount}{" "}
            {familyCount === 1 ? "family" : "families"}
          </p>
        </InspectorBodySection>
        {readOnly ? null : (
          <InspectorBodySection>
            <div className={styles.inspectorStack}>
              <span className={styles.inspectorRowLabel}>Add group</span>
              <AppButton
                variant="secondary"
                tone="black"
                size="xs"
                iconName="plus"
                onClick={() => {
                  const name = window.prompt("New semantic group name", "new-group");
                  if (!name) return;
                  const { system: next, subGroupId } = addSemanticSubGroup(
                    system,
                    collection.id,
                    name,
                  );
                  applyChange(next);
                  setSelection({
                    kind: "semanticSubGroup",
                    id: subGroupId,
                    surface: collection.id,
                  });
                }}
              >
                Add group
              </AppButton>
            </div>
          </InspectorBodySection>
        )}
      </InspectorShell>
    );
  }

  if (selection.kind === "semanticSubGroup") {
    const subGroup = system.semanticSubGroups.find((item) => item.id === selection.id);
    if (!subGroup) return null;
    const familyCount = semanticFamilyKeysForSubGroup(
      system,
      selection.surface,
      selection.id,
    ).length;
    return (
      <InspectorShell
        label={`Semantic group · ${selection.surface}`}
        onClose={onClose}
        actions={editActions(
          <AppButton
            className={styles.inspectorActionDelete}
            variant="tertiary"
            tone="gray"
            size="xs"
            iconName="trash"
            onClick={() => {
              const surfaceLabel =
                SEMANTIC_COLLECTION_LABELS[selection.surface] ?? selection.surface;
              const message =
                familyCount > 0
                  ? `Delete group "${subGroup.name}" from ${surfaceLabel}? ${familyCount} ${familyCount === 1 ? "family" : "families"} on this surface will be removed.`
                  : `Delete group "${subGroup.name}" from ${surfaceLabel}?`;
              if (!window.confirm(message)) return;
              applyChange(deleteSemanticSubGroup(system, selection.surface, selection.id));
              setSelection({ kind: "semanticCollection", id: selection.surface });
            }}
          >
            Delete group
          </AppButton>,
        )}
      >
        <InspectorBodySection>
          <RenameField
            label="Group name"
            value={subGroup.name}
            readOnly={readOnly}
            onCommit={(name) =>
              applyChange(renameSemanticSubGroup(system, subGroup.id, name))
            }
          />
        </InspectorBodySection>
        <InspectorBodySection>
          <div className={styles.inspectorStack}>
            <div className={styles.inspectorRowHeading}>
              <span className={styles.inspectorRowLabel}>Add family</span>
              <span className={styles.inspectorMeta}>
                {familyCount} {familyCount === 1 ? "family" : "families"}
              </span>
            </div>
            {readOnly ? null : (
              <AppButton
                variant="secondary"
                tone="black"
                size="xs"
                iconName="plus"
                onClick={() => {
                  const name = window.prompt("New semantic family name", "new-family");
                  if (!name) return;
                  const { system: next, familyKey } = addSemanticFamily(
                    system,
                    name,
                    selection.id,
                  );
                  if (!familyKey) return;
                  applyChange(next);
                  setSelection({
                    kind: "semanticFamily",
                    id: familyKey,
                    surface: selection.surface,
                  });
                }}
              >
                Add family
              </AppButton>
            )}
          </div>
        </InspectorBodySection>
      </InspectorShell>
    );
  }

  if (selection.kind === "family") {
    const family = system.families.find((item) => item.id === selection.id);
    if (!family) return null;
    const stepped = isSteppedPrimitiveFamily(family);
    const tokenCount = family.steps.length;
    return (
      <InspectorShell
        label="Primitive family"
        onClose={onClose}
        actions={editActions(
          <>
            <AppButton
              variant="secondary"
              tone="black"
              size="xs"
              iconName="copy"
              onClick={() => {
                const name = window.prompt("Duplicate family name", `${family.name} copy`);
                if (!name) return;
                const { system: next, familyId: newFamilyId } = duplicatePrimitiveFamily(
                  system,
                  family.id,
                  name,
                );
                if (!newFamilyId) return;
                applyChange(next);
                setSelection({ kind: "family", id: newFamilyId });
              }}
            >
              Duplicate
            </AppButton>
            <AppButton
              className={styles.inspectorActionDelete}
              variant="tertiary"
              tone="gray"
              size="xs"
              iconName="trash"
              onClick={() => {
                if (!window.confirm(`Delete family "${family.name}"?`)) return;
                applyChange(deleteFamily(system, family.id));
                setSelection(null);
              }}
            >
              Delete family
            </AppButton>
          </>,
        )}
      >
        <InspectorBodySection>
          <RenameField
            label="Family name"
            value={family.name}
            readOnly={readOnly}
            onCommit={(name) => applyChange(renameFamily(system, family.id, name))}
          />
        </InspectorBodySection>
        {readOnly ? null : (
          <InspectorBodySection>
            <SteppedFamilyCheckbox
              checked={stepped}
              onChange={(nextStepped) =>
                applyChange(setPrimitiveFamilyStepped(system, family.id, nextStepped))
              }
            />
          </InspectorBodySection>
        )}
        {stepped ? (
          <InspectorBodySection>
            <StepSpectrumPicker
              label="Steps"
              readOnly={readOnly}
              presentSteps={new Set(family.steps.map((item) => item.step))}
              onStepClick={(stepLabel) => {
                const step = family.steps.find((item) => item.step === stepLabel);
                if (step) setSelection({ kind: "step", id: step.id });
              }}
              onAddStep={(stepLabel) => {
                const { system: next, stepId } = addStep(system, family.id, stepLabel);
                if (!stepId) {
                  window.alert(`Step "${stepLabel}" already exists in ${family.name}.`);
                  return;
                }
                applyChange(next);
              }}
            />
          </InspectorBodySection>
        ) : null}
        {!stepped && !readOnly ? (
          <InspectorBodySection>
            <AddTokenField
              placeholder="white"
              helperText={`${tokenCount} ${tokenCount === 1 ? "token" : "tokens"}`}
              normalizeValue={(value) => value.trim().toLowerCase().replace(/\s+/g, "-")}
              onAdd={(stepLabel) => {
                const { system: next, stepId } = addStep(system, family.id, stepLabel);
                if (!stepId) {
                  window.alert(`Token "${stepLabel}" already exists in ${family.name}.`);
                  return;
                }
                applyChange(next);
                setSelection({ kind: "step", id: stepId });
              }}
            />
          </InspectorBodySection>
        ) : null}
        {!stepped && readOnly ? (
          <InspectorBodySection>
            <p className={styles.inspectorMeta}>
              {tokenCount} {tokenCount === 1 ? "token" : "tokens"}
            </p>
          </InspectorBodySection>
        ) : null}
      </InspectorShell>
    );
  }

  if (selection.kind === "semanticFamily") {
    const family = system.semanticFamilies.find((item) => item.id === selection.id);
    if (!family) return null;
    const tokenCount = system.semantics.filter(
      (token) =>
        token.familyKey === family.id && token.surface === selection.surface,
    ).length;
    return (
      <InspectorShell
        label={`Semantic family · ${selection.surface}`}
        onClose={onClose}
        actions={editActions(
          <>
            <AppButton
              variant="secondary"
              tone="black"
              size="xs"
              iconName="copy"
              onClick={() => {
                const name = window.prompt("Duplicate family name", `${family.name} copy`);
                if (!name) return;
                const { system: next, familyKey: newFamilyKey } = duplicateSemanticFamily(
                  system,
                  family.id,
                  name,
                );
                if (!newFamilyKey) return;
                applyChange(next);
                setSelection({
                  kind: "semanticFamily",
                  id: newFamilyKey,
                  surface: selection.surface,
                });
              }}
            >
              Duplicate
            </AppButton>
            <AppButton
              className={styles.inspectorActionDelete}
              variant="tertiary"
              tone="gray"
              size="xs"
              iconName="trash"
              onClick={() => {
                if (!window.confirm(`Delete semantic family "${family.name}"?`)) return;
                applyChange(deleteSemanticFamily(system, family.id));
                setSelection(null);
              }}
            >
              Delete family
            </AppButton>
          </>,
        )}
      >
        <InspectorBodySection>
          <RenameField
            label="Family name"
            value={family.name}
            readOnly={readOnly}
            onCommit={(name) => applyChange(renameSemanticFamily(system, family.id, name))}
          />
        </InspectorBodySection>
        {readOnly ? (
          <InspectorBodySection>
            <p className={styles.inspectorMeta}>
              {tokenCount} {tokenCount === 1 ? "token" : "tokens"}
            </p>
          </InspectorBodySection>
        ) : (
          <InspectorBodySection>
            <AddTokenField
              helperText={`${tokenCount} ${tokenCount === 1 ? "token" : "tokens"}`}
              onAdd={(roleName) => {
                const trimmed = roleName.trim();
                if (!trimmed) return;
                const { system: next, role } = addSemanticToken(
                  system,
                  selection.surface,
                  family.id,
                  trimmed,
                );
                if (!role) {
                  const normalized = normalizeSemanticRole(trimmed);
                  window.alert(
                    normalized
                      ? `Token "${normalized}" already exists in ${family.name}.`
                      : "Enter a valid token name.",
                  );
                  return;
                }
                applyChange(next);
                setSelection({
                  kind: "semantic",
                  surface: selection.surface,
                  familyKey: family.id,
                  role,
                });
              }}
            />
          </InspectorBodySection>
        )}
      </InspectorShell>
    );
  }

  if (selection.kind === "step") {
    const family = stepFamily.get(selection.id);
    const step = family?.steps.find((item) => item.id === selection.id);
    if (!family || !step) return null;
    const usage = system.semantics.filter(
      (token) => token.ref.light === step.id || token.ref.dark === step.id,
    ).length;
    const stepped = isSteppedPrimitiveFamily(family);
    const primitiveVarReference = `var(--${primitiveVarName(family, step)})`;
    return (
      <InspectorShell
        label="Primitive"
        onClose={onClose}
        actions={editActions(
          <AppButton
            className={styles.inspectorActionDelete}
            variant="tertiary"
            tone="gray"
            size="xs"
            iconName="trash"
            onClick={() => {
              const message =
                usage > 0
                  ? `Delete step "${step.step}" from ${family.name}? ${usage} semantic mapping${usage === 1 ? "" : "s"} will be cleared.`
                  : `Delete step "${step.step}" from ${family.name}?`;
              if (!window.confirm(message)) return;
              applyChange(deleteStep(system, step.id));
              setSelection({ kind: "family", id: family.id });
            }}
          >
            Delete step
          </AppButton>,
        )}
      >
        <InspectorBodySection>
          {stepped ? (
            <StepSpectrumPicker
              label="Step value"
              value={step.step}
              readOnly={readOnly}
              onCommit={(nextStep) => {
                const conflicting = family.steps.find(
                  (item) => item.id !== step.id && item.step === nextStep,
                );
                if (
                  conflicting &&
                  !window.confirm(
                    `Step ${nextStep} is already used in ${family.name}. Swap places with step ${step.step}?`,
                  )
                ) {
                  return;
                }
                const { system: next, stepId: newStepId } = renamePrimitiveStep(
                  system,
                  step.id,
                  nextStep,
                );
                if (!newStepId) return;
                applyChange(next);
                setSelection({ kind: "step", id: newStepId });
              }}
              onAddStep={(stepLabel) => {
                const { system: next, stepId: newStepId } = addStep(
                  system,
                  family.id,
                  stepLabel,
                );
                if (!newStepId) {
                  window.alert(`Step "${stepLabel}" already exists in ${family.name}.`);
                  return;
                }
                applyChange(next);
                setSelection({ kind: "step", id: newStepId });
              }}
            />
          ) : (
            <RenameField
              label="Step name"
              value={step.step}
              readOnly={readOnly}
              onCommit={(nextStep) => {
                const { system: next, stepId: newStepId } = renamePrimitiveStep(
                  system,
                  step.id,
                  nextStep,
                );
                if (!newStepId) {
                  if (nextStep !== step.step) {
                    window.alert(`Step "${nextStep}" already exists in ${family.name}.`);
                  }
                  return;
                }
                applyChange(next);
                setSelection({ kind: "step", id: newStepId });
              }}
            />
          )}
          <VariableCopyBar cssVarReference={primitiveVarReference} />
        </InspectorBodySection>
        <InspectorBodySection>
          <ColorPreviewBar hex={step.hex} />
          {readOnly ? null : (
            <>
              <div className={styles.inspectorControls}>
                <input
                  type="color"
                  className={styles.colorInput}
                  value={rgbHex(step.hex)}
                  onChange={(event) =>
                    applyChange(
                      updatePrimitiveHex(
                        system,
                        step.id,
                        mergePickerHex(step.hex, event.target.value),
                      ),
                    )
                  }
                  aria-label="Primitive color"
                />
                <HexField
                  value={step.hex}
                  onCommit={(hex) => applyChange(updatePrimitiveHex(system, step.id, hex))}
                />
              </div>
              {isUnsetPrimitiveHex(step.hex) ? null : (
                <AlphaField
                  value={step.hex}
                  onCommit={(hex) => applyChange(updatePrimitiveHex(system, step.id, hex))}
                />
              )}
            </>
          )}
        </InspectorBodySection>
        <InspectorBodySection>
          {isUnsetPrimitiveHex(step.hex) ? (
            <p className={styles.inspectorMeta}>Set a hex value to run contrast checks.</p>
          ) : (
            <AccessibilityContrastSection
              checks={surfaceColorContrastChecks(step.hex, system)}
            />
          )}
        </InspectorBodySection>
        <InspectorBodySection>
          <p className={styles.inspectorMeta}>
            Referenced by {usage} semantic token{usage === 1 ? "" : "s"}
          </p>
        </InspectorBodySection>
      </InspectorShell>
    );
  }

  if (selection.kind !== "semantic") return null;

  const token = findSemanticToken(
    system,
    selection.surface,
    selection.familyKey,
    selection.role,
  );
  if (!token) return null;
  const refId = token.ref[theme];
  const hex = semanticHex(system, token, theme, steps);
  const cssVarReference = `var(--ds-${semanticExportVarName(system, token)})`;
  const codifiedComment = codifiedComments.get(`${token.id}::${theme}`) ?? null;
  return (
    <InspectorShell
      label={`Semantic · ${token.surface} · ${theme}`}
      onClose={onClose}
      actions={editActions(
        <AppButton
          className={styles.inspectorActionDelete}
          variant="tertiary"
          tone="gray"
          size="xs"
          iconName="trash"
          onClick={() => {
            if (!window.confirm(`Delete token "${token.role}"?`)) return;
            applyChange(
              deleteSemanticToken(system, token.surface, token.familyKey, token.role),
            );
            setSelection({
              kind: "semanticFamily",
              id: token.familyKey,
              surface: token.surface,
            });
          }}
        >
          Delete token
        </AppButton>,
      )}
      >
      <InspectorBodySection>
        <RenameField
          label="Token name"
          value={token.role}
          readOnly={readOnly}
          onCommit={(name) => {
            const { system: next, role } = renameSemanticTokenRole(
              system,
              token.surface,
              token.familyKey,
              token.role,
              name,
            );
            if (!role) {
              window.alert(`Token "${name}" already exists in this family.`);
              return;
            }
            applyChange(next);
            setSelection({
              kind: "semantic",
              surface: token.surface,
              familyKey: token.familyKey,
              role,
            });
          }}
        />
        <VariableCopyBar cssVarReference={cssVarReference} />
      </InspectorBodySection>
      <InspectorBodySection>
        <div className={styles.inspectorMappedPrimitive}>
          <span className={styles.inspectorRowLabel}>Mapped primitive ({theme})</span>
          <AppNativeSelect
            value={refId ?? ""}
            onValueChange={(next) =>
              applyChange(remapSemantic(system, token.id, theme, next))
            }
            options={
              refId
                ? primitiveOptions
                : [{ value: "", label: "Unmapped — choose primitive" }, ...primitiveOptions]
            }
            size="xs"
            tone="gray"
            fullWidth
            disabled={readOnly}
            aria-label="Mapped primitive token"
          />
        </div>
        <ColorPreviewBar hex={hex} />
      </InspectorBodySection>
      <InspectorBodySection>
        <AccessibilityContrastSection
          checks={
            token.surface === "text"
              ? textTokenContrastChecks(hex, system)
              : surfaceColorContrastChecks(hex, system)
          }
        />
      </InspectorBodySection>
      {readOnly && !token.comments?.[theme] ? null : (
        <InspectorBodySection>
          <TokenCommentSection
            mode={theme}
            comment={token.comments?.[theme] ?? null}
            codifiedComment={codifiedComment}
            readOnly={readOnly}
            onCommit={(text) =>
              applyChange(setSemanticTokenComment(system, token.id, theme, text))
            }
          />
        </InspectorBodySection>
      )}
    </InspectorShell>
  );
}

/**
 * Rationale comment editor for one theme of a semantic token. Comments that
 * match the committed baseline are "codified"; anything else is a session
 * comment living only in the local draft. Both are included in the CSS export.
 */
function TokenCommentSection({
  mode,
  comment,
  codifiedComment,
  readOnly,
  onCommit,
}: {
  mode: ThemeKey;
  comment: string | null;
  codifiedComment: string | null;
  readOnly: boolean;
  onCommit: (text: string | null) => void;
}) {
  const [draft, setDraft] = useState(comment ?? "");
  useEffect(() => setDraft(comment ?? ""), [comment]);

  const isLocal = comment != null && comment !== codifiedComment;
  if (readOnly && !comment) return null;

  return (
    <div className={styles.inspectorStack}>
      <div className={styles.commentHeader}>
        <span className={styles.inspectorRowLabel}>Comment ({mode})</span>
        {isLocal ? (
          <span
            className={`${styles.commentBadge} ${styles.commentBadgeSession}`}
            title="Local — only in your local draft until codified"
          >
            Local
          </span>
        ) : null}
      </div>
      {readOnly ? (
        <p className={styles.commentText}>{comment}</p>
      ) : (
        <textarea
          className={styles.commentInput}
          value={draft}
          rows={3}
          spellCheck={false}
          placeholder="Why this value? Included in the CSS export."
          aria-label={`Token comment (${mode})`}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const trimmed = draft.trim();
            if (trimmed === (comment ?? "")) return;
            onCommit(trimmed || null);
          }}
        />
      )}
    </div>
  );
}

function AccessibilityContrastSection({ checks }: { checks: ContrastCheck[] }) {
  return (
    <div className={styles.inspectorA11y}>
      <span className={styles.inspectorRowLabel}>Accessibility</span>
      <div className={styles.inspectorA11yRows}>
        {checks.map((check) => (
          <div key={check.label} className={styles.inspectorA11yRow}>
            <span className={styles.inspectorA11yLabel}>{check.label}</span>
            <span className={styles.inspectorA11yResult}>
              <span className={styles.inspectorA11yBadge}>AA</span>
              <FaIcon
                name={check.passesAA ? "circle-check" : "circle-xmark"}
                size="xs"
                className={
                  check.passesAA ? styles.inspectorA11yPass : styles.inspectorA11yFail
                }
                title={check.passesAA ? "Passes WCAG AA" : "Fails WCAG AA"}
              />
              <span className={styles.inspectorA11yRatio}>{formatContrastRatio(check.ratio)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function mergePickerHex(currentHex: string, pickedHex: string): string {
  const normalized = normalizeHex(pickedHex);
  if (!normalized) return currentHex;
  const rgb = normalized.length === 9 ? normalized.slice(0, 7) : normalized;
  if (isUnsetPrimitiveHex(currentHex)) return rgb;
  if (isTransparentColor(currentHex)) {
    const alphaSuffix = currentHex.length === 9 ? currentHex.slice(7) : "FF";
    return `${rgb}${alphaSuffix}`;
  }
  return rgb;
}

function AlphaField({
  value,
  readOnly,
  onCommit,
}: {
  value: string;
  readOnly?: boolean;
  onCommit: (hex: string) => void;
}) {
  const alphaPercent = Math.round(colorAlpha(value) * 100);

  return (
    <div className={styles.inspectorAlphaRow}>
      <label className={styles.inspectorRowLabel} htmlFor="primitive-alpha">
        Opacity
      </label>
      <div className={styles.inspectorAlphaControls}>
        <input
          id="primitive-alpha"
          type="range"
          className={styles.alphaInput}
          min={0}
          max={100}
          step={1}
          value={alphaPercent}
          disabled={readOnly}
          onChange={(event) =>
            onCommit(setHexAlpha(value, Number(event.target.value) / 100))
          }
          aria-valuetext={`${alphaPercent}%`}
        />
        <span className={styles.alphaValue}>{alphaPercent}%</span>
      </div>
    </div>
  );
}

function stepInsertSlotLabel(slotIndex: number): string {
  if (slotIndex === 0) return "Add step before 5";
  if (slotIndex === PRIMITIVE_STEP_SPECTRUM.length) {
    return "Add step after 95";
  }
  const lower = PRIMITIVE_STEP_SPECTRUM[slotIndex - 1];
  const upper = PRIMITIVE_STEP_SPECTRUM[slotIndex];
  return `Add step between ${lower} and ${upper}`;
}

function StepSpectrumPicker({
  label,
  value,
  presentSteps,
  readOnly,
  onCommit,
  onAddStep,
  onStepClick,
}: {
  label: string;
  /** Select mode: highlights the current step and commits changes on chip click. */
  value?: string;
  /** Overview mode: shows which spectrum steps exist without a selected step. */
  presentSteps?: ReadonlySet<string>;
  readOnly?: boolean;
  onCommit?: (value: string) => void;
  onAddStep?: (value: string) => void;
  onStepClick?: (value: string) => void;
}) {
  const isOverview = presentSteps != null;
  const [activeInsertSlot, setActiveInsertSlot] = useState<number | null>(null);
  const [insertDraft, setInsertDraft] = useState("");
  const insertInputRef = useRef<HTMLInputElement>(null);
  const numericValue = value != null ? Number(value) : Number.NaN;
  const isNumericStep = !isOverview && Number.isFinite(numericValue);
  const canInsert = !readOnly && onAddStep != null;

  useEffect(() => {
    if (activeInsertSlot == null) return;
    insertInputRef.current?.focus();
    insertInputRef.current?.select();
  }, [activeInsertSlot]);

  function cancelInsert() {
    setActiveInsertSlot(null);
    setInsertDraft("");
  }

  function commitInsert() {
    const stepLabel = insertDraft.trim();
    if (!stepLabel) {
      cancelInsert();
      return;
    }
    onAddStep?.(stepLabel);
    cancelInsert();
  }

  function renderInsertSlot(slotIndex: number) {
    if (!canInsert) return null;
    const editing = activeInsertSlot === slotIndex;
    return (
      <div
        key={`insert-${slotIndex}`}
        className={`${styles.stepSpectrumInsert} ${
          editing ? styles.stepSpectrumInsertEditing : ""
        }`}
      >
        {editing ? (
          <input
            ref={insertInputRef}
            className={styles.stepSpectrumInsertInput}
            value={insertDraft}
            inputMode="numeric"
            spellCheck={false}
            placeholder=""
            aria-label={stepInsertSlotLabel(slotIndex)}
            onChange={(event) =>
              setInsertDraft(event.target.value.replace(/[^\d]/g, ""))
            }
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                event.preventDefault();
                commitInsert();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                cancelInsert();
              }
            }}
            onBlur={cancelInsert}
            onClick={(event) => event.stopPropagation()}
          />
        ) : (
          <button
            type="button"
            className={styles.stepSpectrumInsertHitTarget}
            aria-label={stepInsertSlotLabel(slotIndex)}
            onClick={() => {
              setActiveInsertSlot(slotIndex);
              setInsertDraft("");
            }}
          >
            <span className={styles.stepSpectrumInsertLine} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  if (!isOverview && !isNumericStep) {
    return (
      <div className={styles.inspectorRow}>
        <span className={styles.inspectorRowLabel}>{label}</span>
        <span className={styles.inspectorMeta}>{value}</span>
      </div>
    );
  }

  return (
    <div className={styles.inspectorRow}>
      <span className={styles.inspectorRowLabel}>{label}</span>
      <div
        className={`${styles.stepSpectrumRow} ${
          readOnly ? styles.stepSpectrumRowReadOnly : ""
        } ${activeInsertSlot != null ? styles.stepSpectrumRowEditing : ""}`}
        role={isOverview ? "group" : "radiogroup"}
        aria-label={label}
      >
        {renderInsertSlot(0)}
        {PRIMITIVE_STEP_SPECTRUM.map((stepValue, index) => {
          const stepLabel = String(stepValue);
          const isSelected = !isOverview && stepLabel === value;
          const isPresent = isOverview && presentSteps.has(stepLabel);
          return (
            <Fragment key={stepValue}>
              <button
                type="button"
                role={isOverview ? undefined : "radio"}
                aria-checked={isOverview ? undefined : isSelected}
                aria-label={
                  isOverview
                    ? isPresent
                      ? `Step ${stepValue}`
                      : `Step ${stepValue} (not in family)`
                    : `Step ${stepValue}`
                }
                aria-disabled={isOverview && !isPresent ? true : undefined}
                disabled={readOnly || (isOverview && !isPresent)}
                className={`${styles.stepSpectrumButton} ${
                  isSelected ? styles.stepSpectrumButtonActive : ""
                } ${isPresent && !isSelected ? styles.stepSpectrumButtonPresent : ""}`}
                onClick={() => {
                  if (isOverview) {
                    if (isPresent) onStepClick?.(stepLabel);
                    return;
                  }
                  if (!isSelected) onCommit?.(stepLabel);
                }}
              >
                {stepValue}
              </button>
              {renderInsertSlot(index + 1)}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function AddTokenField({
  onAdd,
  helperText,
  placeholder = "primary",
  normalizeValue = (value: string) => value.trim(),
}: {
  onAdd: (name: string) => void;
  helperText?: string;
  placeholder?: string;
  normalizeValue?: (value: string) => string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const name = normalizeValue(draft);
    if (!name) return;
    onAdd(name);
    setDraft("");
  }

  return (
    <div className={styles.inspectorStack}>
      <span className={styles.inspectorRowLabel}>Add token</span>
      <div className={styles.inspectorInlineField}>
        <input
          className={styles.inspectorInput}
          value={draft}
          spellCheck={false}
          placeholder={placeholder}
          aria-label="New token name"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
          }}
        />
        <AppButton variant="secondary" tone="black" size="xs" iconName="plus" onClick={commit}>
          Add
        </AppButton>
      </div>
      {helperText ? <p className={styles.inspectorMeta}>{helperText}</p> : null}
    </div>
  );
}

function SteppedFamilyCheckbox({
  checked,
  readOnly,
  onChange,
}: {
  checked: boolean;
  readOnly?: boolean;
  onChange: (stepped: boolean) => void;
}) {
  return (
    <label
      className={`${styles.inspectorCheckboxRow} ${
        readOnly ? styles.inspectorCheckboxRowDisabled : ""
      }`}
    >
      <AppCheckbox
        checkboxSize="xs"
        checked={checked}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.inspectorCheckboxLabel}>Stepped ramp (5–95)</span>
    </label>
  );
}

function HexField({
  value,
  readOnly,
  onCommit,
}: {
  value: string;
  readOnly?: boolean;
  onCommit: (hex: string) => void;
}) {
  const unset = isUnsetPrimitiveHex(value);
  const [draft, setDraft] = useState(unset ? "" : value);
  useEffect(() => setDraft(unset ? "" : value), [value, unset]);

  return (
    <input
      className={styles.hexInput}
      value={draft}
      spellCheck={false}
      disabled={readOnly}
      placeholder={unset ? "#RRGGBB" : undefined}
      onChange={(event) => setDraft(event.target.value.toUpperCase())}
      onBlur={() => {
        const next = normalizeHex(draft);
        if (next) {
          if (next !== value) onCommit(next);
          setDraft(isUnsetPrimitiveHex(next) ? "" : next);
          return;
        }
        setDraft(unset ? "" : value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      aria-label="Primitive hex value"
    />
  );
}

function RenameField({
  label,
  value,
  readOnly,
  onCommit,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className={styles.inspectorRow}>
      <label className={styles.inspectorRowLabel}>{label}</label>
      <input
        className={`${styles.inspectorInput} ${styles.inspectorRowControl}`}
        value={draft}
        spellCheck={false}
        disabled={readOnly}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const trimmed = draft.trim();
          if (trimmed && trimmed !== value) onCommit(trimmed);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </div>
  );
}
