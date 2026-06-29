import {
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
  MiniMap,
  Panel,
  PanOnScrollMode,
  ReactFlow,
  useNodesState,
  type Edge,
  type Node,
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
} from "../../lib/colorSandbox/colorSandboxStorage";
import {
  setColorSandboxRuntimePreview,
} from "../../lib/colorSandbox/colorSandboxRuntime";
import {
  addFamily,
  addSemanticFamily,
  addSemanticToken,
  addStep,
  buildColorSystem,
  duplicatePrimitiveFamily,
  duplicateSemanticFamily,
  deleteCollection,
  deleteFamily,
  deleteSemanticFamily,
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
  renamePrimitiveStep,
  renameCollection,
  renameFamily,
  renameSemanticCollection,
  renameSemanticFamily,
  renameSemanticTokenRole,
  renameSemanticSubGroup,
  semanticFamilyKeysForSurface,
  semanticFamilyKeysForSubGroup,
  semanticFamilyLabel,
  semanticFamilySlotId,
  semanticHex,
  semanticTokenRolesForFamily,
  semanticTokensForFamily,
  semanticTokenVariableName,
  findSemanticToken,
  formatContrastRatio,
  sortPrimitiveSteps,
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
import { colorSystemEdgeTypes } from "./ColorSystemEdges";
import {
  colorSystemNodeTypes,
  type CollectionNodeData,
  type PrimitiveNodeData,
  type SemanticNodeData,
  type SemanticSubGroupNodeData,
} from "./ColorSystemNodes";
import styles from "./ColorSandboxPage.module.scss";

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
const REACT_FLOW_NO_PAN = { className: "nopan" } as const;

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
  const [system, setSystem] = useState<ColorSystem>(() => loadColorSandboxSystem("codeOrg"));
  const [applyRuntime, setApplyRuntime] = useState(() => readColorSandboxApplyRuntime());
  const [selection, setSelection] = useState<Selection>(null);
  const [exported, setExported] = useState(false);
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);

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
      setSystem(next);
      persist(next);
    },
    [persist],
  );

  const toggleApplyRuntime = useCallback((enabled: boolean) => {
    setApplyRuntime(enabled);
    setColorSandboxRuntimePreview(enabled);
    notifyColorSandboxUpdated();
  }, []);

  const selectStep = useCallback(
    (id: string) => setSelection({ kind: "step", id }),
    [],
  );
  const selectFamily = useCallback(
    (id: string) => setSelection({ kind: "family", id }),
    [],
  );
  const selectCollection = useCallback(
    (id: string) => setSelection({ kind: "collection", id }),
    [],
  );
  const selectSemantic = useCallback(
    (id: string) => {
      const token = system.semantics.find((item) => item.id === id);
      if (!token) return;
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
    (id: string, surface: string) =>
      setSelection({ kind: "semanticFamily", id, surface }),
    [],
  );
  const selectSemanticCollection = useCallback(
    (id: string) => setSelection({ kind: "semanticCollection", id }),
    [],
  );
  const selectSemanticSubGroup = useCallback(
    (surface: string, id: string) =>
      setSelection({ kind: "semanticSubGroup", id, surface }),
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
    let semanticCollectionX = 0;

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
          position: { x: cursorX, y: firstFamilyY },
          style: { width: subGroupW, height: subGroupH },
          data: buildSubGroupData(collection.id, subGroupId),
        });
        childNodes.push(...subGroupChildren);
        cursorX += subGroupW + SUB_GROUP_GAP_X;
      }

      const cardWidth =
        (cursorX > CARD_PADDING ? cursorX - SUB_GROUP_GAP_X : 0) + CARD_PADDING;
      const cardHeight =
        (maxSubGroupH > 0 ? firstFamilyY + maxSubGroupH : COLLECTION_HEADER_H) +
        CARD_PADDING;

      result.push({
        ...REACT_FLOW_NO_PAN,
        id: collectionNodeId,
        type: "collectionHeader",
        position: { x: semanticCollectionX, y: semanticY },
        data: buildCollectionData(collection.id, "semantic"),
        style: { width: Math.max(cardWidth, 220), height: cardHeight },
      });
      result.push(...childNodes);

      semanticCollectionX += Math.max(cardWidth, 220) + COLLECTION_GAP_X;
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

  function resetDraft() {
    const fresh =
      brandTheme === "codeAi" ? buildCodeAiColorSystem() : buildColorSystem();
    setSelection(null);
    signatureRef.current = "";
    applyChange(fresh);
  }

  function clearRuntimePreview() {
    toggleApplyRuntime(false);
  }

  function downloadExport() {
    const payload = { brand: brandTheme, ...system };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `color-system-${brandTheme}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
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
        sensors={sensors}
        collisionDetection={colorSystemCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
      <ReactFlow
        className={styles.flow}
        nodes={nodes}
        edges={edges}
        nodeTypes={colorSystemNodeTypes}
        edgeTypes={colorSystemEdgeTypes}
        onNodesChange={onNodesChange}
        onPaneClick={() => setSelection(null)}
        nodesConnectable={false}
        nodesDraggable={false}
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
        panOnDrag
        zoomOnScroll={false}
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} />
        <Controls showInteractive={false} />
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
          <div className={styles.toolbarDivider} role="separator" />
          <div className={styles.runtimePreview}>
            <label className={styles.runtimePreviewToggle}>
              <AppCheckbox
                checkboxSize="s"
                checked={applyRuntime}
                onChange={(event) => toggleApplyRuntime(event.target.checked)}
              />
              <span className={styles.runtimePreviewLabel}>Apply to app</span>
            </label>
            {applyRuntime ? (
              <Tooltip content="Clear live preview" position="bottom">
                <AppButton
                  variant="secondary"
                  tone="gray"
                  size="xs"
                  iconName="xmark"
                  onClick={clearRuntimePreview}
                  aria-label="Clear live preview"
                />
              </Tooltip>
            ) : null}
          </div>
          <div className={styles.toolbarDivider} role="separator" />
          <div className={styles.toolbarActions}>
            <AppButton
              variant="secondary"
              tone="black"
              size="s"
              iconName="rotate-left"
              fullWidth
              onClick={resetDraft}
            >
              Reset
            </AppButton>
            <AppButton
              variant="primary"
              tone="purple"
              size="s"
              iconName={exported ? "check" : "download"}
              fullWidth
              onClick={downloadExport}
            >
              {exported ? "Exported" : "Export"}
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
              applyChange={applyChange}
              setSelection={setSelection}
              onClose={() => setSelection(null)}
            />
          </Panel>
        ) : null}
      </ReactFlow>

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
      <div className={styles.inspectorSection}>{children}</div>
      {actions ? (
        <div className={`${styles.inspectorSection} ${styles.inspectorSectionActions}`}>
          <div className={styles.inspectorActions}>{actions}</div>
        </div>
      ) : null}
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
  applyChange: (next: ColorSystem) => void;
  setSelection: (selection: Selection) => void;
  onClose: () => void;
}) {
  if (selection.kind === "collection") {
    const collection = system.collections.find((item) => item.id === selection.id);
    if (!collection) return null;
    const families = familiesByCollection(system, collection.id);
    return (
      <InspectorShell
        label="Primitive collection"
        onClose={onClose}
        actions={
          <>
            <AppButton
              variant="secondary"
              tone="black"
              size="xs"
              iconName="plus"
              onClick={() => {
                const name = window.prompt("New primitive family name", "new-family");
                if (!name) return;
                const seed = families[families.length - 1]?.id;
                const { system: next, familyId } = addFamily(
                  system,
                  collection.id,
                  name,
                  seed,
                );
                applyChange(next);
                setSelection({ kind: "family", id: familyId });
              }}
            >
              Add family
            </AppButton>
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
              Delete
            </AppButton>
          </>
        }
      >
        <RenameField
          label="Collection name"
          value={collection.name}
          onCommit={(name) =>
            applyChange(renameCollection(system, collection.id, name))
          }
        />
        <p className={styles.inspectorMeta}>{families.length} families</p>
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
      <InspectorShell label="Semantic collection" onClose={onClose}>
        <RenameField
          label="Collection name"
          value={collection.name}
          onCommit={(name) =>
            applyChange(renameSemanticCollection(system, collection.id, name))
          }
        />
        <p className={styles.inspectorMeta}>
          {subGroupCount} {subGroupCount === 1 ? "group" : "groups"} · {familyCount}{" "}
          {familyCount === 1 ? "family" : "families"}
        </p>
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
        actions={
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
        }
      >
        <RenameField
          label="Group name"
          value={subGroup.name}
          onCommit={(name) =>
            applyChange(renameSemanticSubGroup(system, subGroup.id, name))
          }
        />
        <p className={styles.inspectorMeta}>{familyCount} families</p>
      </InspectorShell>
    );
  }

  if (selection.kind === "family") {
    const family = system.families.find((item) => item.id === selection.id);
    if (!family) return null;
    return (
      <InspectorShell
        label="Primitive family"
        onClose={onClose}
        actions={
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
          </>
        }
      >
        <RenameField
          label="Family name"
          value={family.name}
          onCommit={(name) => applyChange(renameFamily(system, family.id, name))}
        />
        <p className={styles.inspectorMeta}>{family.steps.length} steps</p>
        <AddStepField
          onAdd={(stepLabel) => {
            const { system: next, stepId } = addStep(system, family.id, stepLabel);
            if (!stepId) return;
            applyChange(next);
            setSelection({ kind: "step", id: stepId });
          }}
        />
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
        actions={
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
          </>
        }
      >
        <RenameField
          label="Family name"
          value={family.name}
          onCommit={(name) => applyChange(renameSemanticFamily(system, family.id, name))}
        />
        <p className={styles.inspectorMeta}>{tokenCount} tokens</p>
        <AddTokenField
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
    return (
      <InspectorShell
        label="Primitive"
        onClose={onClose}
        actions={
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
          </AppButton>
        }
      >
        <StepValueField
          label="Step value"
          value={step.step}
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
        <p className={styles.inspectorTitle}>
          {family.name}-{step.step}
        </p>
        <span
          className={`${styles.inspectorPreview} ${
            isTransparentColor(step.hex) ? styles.inspectorPreviewAlpha : ""
          }`}
          style={{ background: cssColor(step.hex), color: readableTextOn(step.hex) }}
        >
          {step.hex}
        </span>
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
        <AlphaField
          value={step.hex}
          onCommit={(hex) => applyChange(updatePrimitiveHex(system, step.id, hex))}
        />
        <AccessibilityContrastSection checks={surfaceColorContrastChecks(step.hex, system)} />
        <p className={styles.inspectorMeta}>
          Referenced by {usage} semantic token{usage === 1 ? "" : "s"}
        </p>
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
  const variableName = semanticTokenVariableName(system, token);
  return (
    <InspectorShell
      label={`Semantic · ${token.surface} · ${theme}`}
      onClose={onClose}
      actions={
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
        </AppButton>
      }
    >
      <RenameField
        label="Token name"
        value={token.role}
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
      <code className={styles.inspectorVar}>{variableName}</code>
      <span
        className={`${styles.inspectorPreview} ${
          isTransparentColor(hex) ? styles.inspectorPreviewAlpha : ""
        }`}
        style={{ background: cssColor(hex), color: readableTextOn(hex) }}
      >
        {hex}
      </span>
      <div className={styles.inspectorRow}>
        <span className={styles.inspectorRowLabel}>Mapped primitive ({theme})</span>
        <div className={styles.inspectorRowControl}>
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
            aria-label="Mapped primitive token"
          />
        </div>
      </div>
      <AccessibilityContrastSection
        checks={
          token.surface === "text"
            ? textTokenContrastChecks(hex, system)
            : surfaceColorContrastChecks(hex, system)
        }
      />
    </InspectorShell>
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
  if (isTransparentColor(currentHex)) {
    const alphaSuffix = currentHex.length === 9 ? currentHex.slice(7) : "FF";
    return `${rgb}${alphaSuffix}`;
  }
  return rgb;
}

function AlphaField({
  value,
  onCommit,
}: {
  value: string;
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

function StepValueField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
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
        inputMode="numeric"
        spellCheck={false}
        aria-label={label}
        onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, ""))}
        onBlur={() => {
          const trimmed = draft.trim();
          if (trimmed && trimmed !== value) onCommit(trimmed);
          else setDraft(value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </div>
  );
}

function AddTokenField({ onAdd }: { onAdd: (role: string) => void }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const roleName = draft.trim();
    if (!roleName) return;
    onAdd(roleName);
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
          placeholder="primary"
          aria-label="New semantic token name"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
          }}
        />
        <AppButton variant="secondary" tone="black" size="xs" iconName="plus" onClick={commit}>
          Add
        </AppButton>
      </div>
    </div>
  );
}

function AddStepField({ onAdd }: { onAdd: (step: string) => void }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const stepLabel = draft.trim();
    if (!stepLabel) return;
    onAdd(stepLabel);
    setDraft("");
  }

  return (
    <div className={styles.inspectorStack}>
      <span className={styles.inspectorRowLabel}>Add step</span>
      <div className={styles.inspectorInlineField}>
        <input
          className={styles.inspectorInput}
          value={draft}
          inputMode="numeric"
          placeholder="Step number, e.g. 50"
          aria-label="New step number"
          onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
          }}
        />
        <AppButton variant="secondary" tone="black" size="xs" onClick={commit}>
          Add
        </AppButton>
      </div>
    </div>
  );
}

function HexField({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <input
      className={styles.hexInput}
      value={draft}
      spellCheck={false}
      onChange={(event) => setDraft(event.target.value.toUpperCase())}
      onBlur={() => {
        const next = normalizeHex(draft);
        if (next) {
          if (next !== value) onCommit(next);
          setDraft(next);
          return;
        }
        setDraft(value);
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
  onCommit,
}: {
  label: string;
  value: string;
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
