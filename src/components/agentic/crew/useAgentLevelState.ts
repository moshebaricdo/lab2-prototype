import { useCallback, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ChatMessage } from "../../../types/chat";
import type { FileItem } from "../../../types/file";
import type {
  TutorPolicy,
  TutorSubmitHandler,
} from "../../../types/tutor";
import type { TutorRunnerContracts } from "../../../lib/tutor/runners/runnerContracts";
import type {
  AgentCustomization,
  AgentLevelConfig,
  AgentSpecialist,
} from "../../../types/agentLab";
import { normalizeAgentEffort } from "../../../lib/backpack/agentBackpack";
import type { TutorValidatedChange } from "../../../lib/tutor/types";
import {
  buildAgentSystemPrompt,
  clampSpecialistChanges,
  filterTreeForAgent,
  formatBlockedScopeNote,
  specialistComposerMode,
} from "../../../lib/tutor/agents/specialistRun";
import {
  applyDispatchToChatMessage,
  buildOrchestrationContract,
} from "../../../lib/tutor/agents/orchestration";
import { resolveContextFilePaths } from "./agentContext";

function applyCustomization(
  specialist: AgentSpecialist,
  scopableFiles: string[],
  customization?: AgentCustomization,
): AgentSpecialist {
  const filePaths = resolveContextFilePaths(
    specialist,
    scopableFiles,
    customization,
  );
  if (!customization) {
    return {
      ...specialist,
      contextScope: { ...specialist.contextScope, filePaths },
    };
  }
  return {
    ...specialist,
    role: customization.role ?? specialist.role,
    tagline: customization.tagline ?? specialist.tagline,
    iconName: customization.iconName ?? specialist.iconName,
    accent: customization.accent ?? specialist.accent,
    contract: customization.contract ?? specialist.contract,
    effort: normalizeAgentEffort(
      customization.effort ?? specialist.effort,
    ),
    revealPolicy: customization.revealPolicy ?? specialist.revealPolicy,
    writablePaths: customization.writablePaths ?? specialist.writablePaths,
    capabilities: {
      ...specialist.capabilities,
      workspaceEdits:
        customization.workspaceEdits ?? specialist.capabilities.workspaceEdits,
      readLivePreview:
        customization.readLivePreview ??
        specialist.capabilities.readLivePreview,
    },
    contextScope: {
      ...specialist.contextScope,
      filePaths,
    },
  };
}

/**
 * Per-turn TutorPolicy for a specialist. The agent's capabilities ARE the
 * policy — the existing router then permits, denies, and explains exactly as
 * it does for any level, which is the point: specialists ride the real
 * pipeline, including denial explanations and edit clarification.
 */
function policyForSpecialist(
  specialist: AgentSpecialist,
  levelPolicy: TutorPolicy,
): TutorPolicy {
  return {
    lab: levelPolicy.lab,
    supportContext: levelPolicy.supportContext,
    capabilities: {
      guidance: specialist.capabilities.guidance,
      planning: specialist.capabilities.planning,
      workspaceEdits: specialist.capabilities.workspaceEdits,
      // Validation review stays a Tutor-level concern in V4.
      validationReview: false,
      proposalReview: levelPolicy.capabilities.proposalReview,
    },
    pedagogy: {
      ...levelPolicy.pedagogy,
      revealPolicy:
        specialist.revealPolicy ?? levelPolicy.pedagogy.revealPolicy,
    },
    routingProfile: "guided-level",
  };
}

interface UseAgentLevelStateOptions {
  config?: AgentLevelConfig;
  /** Live scopable paths in the current project (for default-all file binding). */
  scopableFiles?: string[];
  /** Resolved level tutor policy (dev settings applied). */
  levelPolicy: TutorPolicy;
  /** Resolved level runner contracts (dev settings applied). */
  levelContracts: TutorRunnerContracts;
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
}

/**
 * Agent capability for WebLab2LevelPage. Owns roster state (active agent,
 * locks, customizations) and derives the three values that make a specialist
 * real on the existing pipeline: a TutorPolicy, runner contracts, and a
 * context filter for the file tree. The page swaps these into its normal
 * useWebLab2TutorFlow inputs — no parallel pipeline.
 *
 * Stream hygiene: switching agents queues a lightweight divider for the next
 * send only — no "fresh context" copy, just which agent is active.
 */
export function useAgentLevelState({
  config,
  scopableFiles = [],
  levelPolicy,
  levelContracts,
  setChatMessages,
}: UseAgentLevelStateOptions) {
  const enabled = Boolean(config && config.specialists.length > 0);
  const specialistsBase = config?.specialists ?? [];

  const [activeId, setActiveId] = useState(
    config?.initialAgentId ?? "tutor",
  );
  const [customizations, setCustomizations] = useState<
    Record<string, AgentCustomization>
  >({});
  /**
   * Agents recalled from the backpack at runtime (spec V4 Decision D/E). They
   * append to the authored roster, always land unlocked, and carry a distinct
   * chip treatment so a saved agent reads differently from an authored one.
   */
  const [recalledSpecialists, setRecalledSpecialists] = useState<
    AgentSpecialist[]
  >([]);
  /** Authored specialists the student removed from this project (still in the + menu). */
  const [excludedProvidedIds, setExcludedProvidedIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  /** Maps a live recalled roster id → backpack item id (for “Added” in the + menu). */
  const [recalledBackpackSources, setRecalledBackpackSources] = useState<
    Record<string, string>
  >({});

  const baseUnlockedIds = useMemo(() => {
    const locked = new Set(config?.lockedAgentIds ?? []);
    return new Set(
      specialistsBase
        .filter((s) => s.unlocked && !locked.has(s.id))
        .map((s) => s.id),
    );
  }, [specialistsBase, config?.lockedAgentIds]);

  const providedCatalog = useMemo(
    () =>
      specialistsBase.filter(
        (specialist) =>
          specialist.id !== "tutor" && baseUnlockedIds.has(specialist.id),
      ),
    [specialistsBase, baseUnlockedIds],
  );

  const activeSavedBackpackItemIds = useMemo(
    () => new Set(Object.values(recalledBackpackSources)),
    [recalledBackpackSources],
  );

  const projectSpecialistIds = useMemo(() => {
    const ids = new Set<string>();
    for (const specialist of specialistsBase) {
      if (specialist.id === "tutor") ids.add(specialist.id);
      else if (!excludedProvidedIds.has(specialist.id)) ids.add(specialist.id);
    }
    for (const specialist of recalledSpecialists) ids.add(specialist.id);
    return ids;
  }, [specialistsBase, excludedProvidedIds, recalledSpecialists]);

  const recalledAgentIds = useMemo(
    () => new Set(recalledSpecialists.map((s) => s.id)),
    [recalledSpecialists],
  );

  const unlockedIds = useMemo<ReadonlySet<string>>(() => {
    const set = new Set(baseUnlockedIds);
    for (const specialist of recalledSpecialists) set.add(specialist.id);
    return set;
  }, [baseUnlockedIds, recalledSpecialists]);

  const specialists = useMemo(
    () =>
      [
        ...specialistsBase.filter(
          (specialist) =>
            specialist.id === "tutor" ||
            !excludedProvidedIds.has(specialist.id),
        ),
        ...recalledSpecialists,
      ].map((specialist) =>
        applyCustomization(
          specialist,
          scopableFiles,
          customizations[specialist.id],
        ),
      ),
    [
      specialistsBase,
      excludedProvidedIds,
      recalledSpecialists,
      customizations,
      scopableFiles,
    ],
  );

  const activeSpecialist =
    specialists.find((s) => s.id === activeId) ?? specialists[0];
  const isTutorActive = !enabled || activeSpecialist?.id === "tutor";

  /** Divider inserted lazily before the next user message after an agent switch. */
  const pendingDividerRef = useRef<ChatMessage | null>(null);

  const queueAgentSwitchDivider = useCallback((specialist: AgentSpecialist) => {
    pendingDividerRef.current = {
      role: "assistant",
      content: "",
      agentDivider: {
        label: specialist.role,
        iconName: specialist.iconName,
        accent: specialist.accent,
      },
    };
  }, []);

  const selectAgent = useCallback(
    (id: string) => {
      if (!enabled || id === activeId) return;
      if (!unlockedIds.has(id)) return;
      const specialist = specialists.find((s) => s.id === id);
      if (!specialist) return;
      setActiveId(id);
      if (id !== "tutor") {
        queueAgentSwitchDivider(specialist);
      }
    },
    [activeId, enabled, specialists, unlockedIds, queueAgentSwitchDivider],
  );

  const setAgentCustomization = useCallback(
    (agentId: string, customization: AgentCustomization) => {
      setCustomizations((current) => ({
        ...current,
        [agentId]: customization,
      }));
    },
    [],
  );

  /**
   * Recall a saved agent into the live roster. Its id is de-duped against the
   * current roster (a student may recall the same saved agent twice, or one
   * whose id collides with an authored agent), then it becomes the active
   * agent with the usual active-agent switch.
   */
  const addRecalledAgent = useCallback(
    (
      specialist: AgentSpecialist,
      options?: { backpackItemId?: string },
    ): string => {
      const backpackItemId = options?.backpackItemId;
      if (backpackItemId) {
        const existingId = Object.entries(recalledBackpackSources).find(
          ([, sourceId]) => sourceId === backpackItemId,
        )?.[0];
        if (existingId && projectSpecialistIds.has(existingId)) {
          setActiveId(existingId);
          return existingId;
        }
      }

      const taken = new Set([
        ...specialistsBase.map((s) => s.id),
        ...recalledSpecialists.map((s) => s.id),
      ]);
      let id = specialist.id;
      if (taken.has(id)) {
        let suffix = 2;
        while (taken.has(`${specialist.id}-${suffix}`)) suffix += 1;
        id = `${specialist.id}-${suffix}`;
      }
      const recalled: AgentSpecialist = { ...specialist, id, unlocked: true };
      setRecalledSpecialists((current) => [...current, recalled]);
      if (backpackItemId) {
        setRecalledBackpackSources((current) => ({
          ...current,
          [id]: backpackItemId,
        }));
      }
      setActiveId(id);
      if (id !== "tutor") {
        queueAgentSwitchDivider(recalled);
      }
      return id;
    },
    [
      specialistsBase,
      recalledSpecialists,
      recalledBackpackSources,
      projectSpecialistIds,
    ],
  );

  const addProvidedToProject = useCallback(
    (agentId: string) => {
      if (agentId === "tutor" || !unlockedIds.has(agentId)) return;
      setExcludedProvidedIds((current) => {
        if (!current.has(agentId)) return current;
        const next = new Set(current);
        next.delete(agentId);
        return next;
      });
      setActiveId(agentId);
    },
    [unlockedIds],
  );

  const removeRecalledAgent = useCallback(
    (agentId: string) => {
      setRecalledSpecialists((current) => {
        if (!current.some((specialist) => specialist.id === agentId)) {
          return current;
        }
        return current.filter((specialist) => specialist.id !== agentId);
      });
      setRecalledBackpackSources((current) => {
        if (!(agentId in current)) return current;
        const next = { ...current };
        delete next[agentId];
        return next;
      });
      setCustomizations((current) => {
        if (!(agentId in current)) return current;
        const next = { ...current };
        delete next[agentId];
        return next;
      });
      if (activeId === agentId) {
        setActiveId("tutor");
        pendingDividerRef.current = null;
      }
    },
    [activeId],
  );

  const removeAgentFromProject = useCallback(
    (agentId: string) => {
      if (agentId === "tutor") return;
      if (recalledAgentIds.has(agentId)) {
        removeRecalledAgent(agentId);
        return;
      }
      if (!specialistsBase.some((specialist) => specialist.id === agentId)) {
        return;
      }
      setExcludedProvidedIds((current) => {
        const next = new Set(current);
        next.add(agentId);
        return next;
      });
      setCustomizations((current) => {
        if (!(agentId in current)) return current;
        const next = { ...current };
        delete next[agentId];
        return next;
      });
      if (activeId === agentId) {
        setActiveId("tutor");
        pendingDividerRef.current = null;
      }
    },
    [activeId, recalledAgentIds, removeRecalledAgent, specialistsBase],
  );

  const canRemoveFromProject = useCallback(
    (agentId: string) =>
      agentId !== "tutor" && projectSpecialistIds.has(agentId),
    [projectSpecialistIds],
  );

  // ── Orchestrator-assisted dispatch (spec Decision C) ───────────────────

  const tutorRole = config?.tutorRole ?? "tutor";
  const isOrchestrating = enabled && tutorRole !== "tutor";
  /** Agents the orchestrating Tutor may dispatch to (unlocked, non-Tutor). */
  const dispatchableSpecialists = useMemo(
    () =>
      specialists.filter((s) => s.id !== "tutor" && unlockedIds.has(s.id)),
    [specialists, unlockedIds],
  );

  // ── Values the page swaps into its existing tutor-flow inputs ──────────

  const tutorPolicy = useMemo(() => {
    if (isTutorActive || !activeSpecialist) return levelPolicy;
    return policyForSpecialist(activeSpecialist, levelPolicy);
  }, [isTutorActive, activeSpecialist, levelPolicy]);

  const runnerContracts = useMemo<TutorRunnerContracts>(() => {
    if (isTutorActive || !activeSpecialist) {
      if (!isOrchestrating || dispatchableSpecialists.length === 0) {
        return levelContracts;
      }
      // The orchestration addendum composes with (not replaces) the level's
      // own contracts, on every runner — whichever route resolves, the Tutor
      // knows it delegates instead of doing specialist work.
      const orchestration = buildOrchestrationContract(dispatchableSpecialists);
      const compose = (base?: string) =>
        [base, orchestration].filter(Boolean).join("\n\n");
      return {
        build: compose(levelContracts.build),
        plan: compose(levelContracts.plan),
        help: compose(levelContracts.help),
      };
    }
    const contract = buildAgentSystemPrompt(activeSpecialist);
    return { build: contract, plan: contract, help: contract };
  }, [
    isTutorActive,
    activeSpecialist,
    levelContracts,
    isOrchestrating,
    dispatchableSpecialists,
  ]);

  const filterFilesForActiveAgent = useCallback(
    (tree: FileItem[]): FileItem[] => {
      if (isTutorActive || !activeSpecialist) return tree;
      return filterTreeForAgent(tree, activeSpecialist);
    },
    [isTutorActive, activeSpecialist],
  );

  /**
   * Plan file the active specialist authors (Decision A — named plans). A
   * planning-capable specialist whose produced/writable artifact is a Markdown
   * file under Plans/ drives the planning runner's target filename, so e.g. a
   * spec writer can author `Plans/gallery-spec.md` instead of the default.
   */
  const planningFileName = useMemo<string | undefined>(() => {
    if (isTutorActive || !activeSpecialist?.capabilities.planning) return undefined;
    const isPlanArtifact = (path: string) => {
      const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
      return parts.at(-2) === "Plans" && Boolean(parts.at(-1)?.toLowerCase().endsWith(".md"));
    };
    return (
      activeSpecialist.produces.find((artifact) => isPlanArtifact(artifact.path))?.path ??
      activeSpecialist.writablePaths.find(isPlanArtifact)
    );
  }, [isTutorActive, activeSpecialist]);

  /**
   * Write-scope clamp for the active specialist's proposed changes (spec V4,
   * item 4). The Tutor and unscoped agents never clamp; a scoped specialist
   * drops out-of-scope writes and returns the explanation note.
   */
  const clampActiveAgentChanges = useCallback(
    (changes: TutorValidatedChange[]) => {
      if (isTutorActive || !activeSpecialist || activeSpecialist.writablePaths.length === 0) {
        return { allowed: changes, note: "" };
      }
      const { allowed, blocked } = clampSpecialistChanges(changes, activeSpecialist);
      return { allowed, note: formatBlockedScopeNote(blocked) };
    },
    [isTutorActive, activeSpecialist],
  );

  /**
   * Wraps the flow's submit handler: flushes a pending agent-switch divider,
   * forces the specialist's composer mode (plan/build/help), attaches a context
   * receipt, and parses orchestrator dispatches.
   */
  const wrapTutorSubmit = useCallback(
    (handler: TutorSubmitHandler): TutorSubmitHandler =>
      async (message, conversation, requestMode, options) => {
        const divider = pendingDividerRef.current;
        if (divider) {
          pendingDividerRef.current = null;
          setChatMessages((current) => {
            const lastUserIndex = current
              .map((m) => m.role)
              .lastIndexOf("user");
            if (lastUserIndex === -1) return [...current, divider];
            return [
              ...current.slice(0, lastUserIndex),
              divider,
              ...current.slice(lastUserIndex),
            ];
          });
        }

        const effectiveMode =
          !isTutorActive && activeSpecialist
            ? specialistComposerMode(activeSpecialist)
            : requestMode;

        const orchestratingTurn =
          isOrchestrating && isTutorActive && dispatchableSpecialists.length > 0;
        const result = await handler(
          message,
          conversation,
          orchestratingTurn ? "help" : effectiveMode,
          options,
        );
        if (!result) return result;

        if (!orchestratingTurn) return result;
        return applyDispatchToChatMessage(result, dispatchableSpecialists);
      },
    [
      setChatMessages,
      isOrchestrating,
      isTutorActive,
      activeSpecialist,
      dispatchableSpecialists,
    ],
  );

  const thinkingLabelPrefix =
    enabled && activeSpecialist ? activeSpecialist.role : undefined;

  const getBackpackSourceId = useCallback(
    (agentId: string) => recalledBackpackSources[agentId],
    [recalledBackpackSources],
  );

  return {
    enabled,
    specialists,
    activeId: activeSpecialist?.id ?? activeId,
    activeSpecialist,
    unlockedIds,
    recalledAgentIds,
    selectAgent,
    addRecalledAgent,
    addProvidedToProject,
    removeRecalledAgent,
    removeAgentFromProject,
    canRemoveFromProject,
    getBackpackSourceId,
    providedCatalog,
    projectSpecialistIds,
    activeSavedBackpackItemIds,
    customizations,
    setAgentCustomization,
    allowCustomization: Boolean(config?.allowCustomization),
    allowAgentLibrary: Boolean(config?.allowAgentLibrary),
    tutorRole,
    isOrchestrating,
    tutorPolicy,
    runnerContracts,
    filterFilesForActiveAgent,
    planningFileName,
    clampActiveAgentChanges,
    wrapTutorSubmit,
    thinkingLabelPrefix,
  };
}
