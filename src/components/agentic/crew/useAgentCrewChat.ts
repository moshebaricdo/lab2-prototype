import { useCallback, useMemo, useRef, useState } from "react";

function applyCustomization(
  specialist: AgentSpecialist,
  customization?: AgentCustomization,
): AgentSpecialist {
  if (!customization) return specialist;
  return {
    ...specialist,
    contract: customization.contract ?? specialist.contract,
    contextScope: {
      ...specialist.contextScope,
      filePaths:
        customization.filePaths ?? specialist.contextScope.filePaths,
    },
  };
}
import type { ChatMessage } from "../../../types/chat";
import type { MockTutorConfig, TutorSubmitHandler } from "../../../types/tutor";
import type { FileItem } from "../../../types/file";
import type {
  AgentCustomization,
  AgentSpecialist,
} from "../../../types/agentLab";
import {
  packedContextPaths,
  runSpecialistTurn,
} from "../../../lib/tutor/agents/specialistRun";
import {
  a11yUnlockNote,
  buildSwitchNote,
  crewAcceptFollowUps,
  type CrewProposalKey,
  type CrewScriptedReply,
  type CrewSpecialistScript,
} from "../../../data/agentic";
import { describeAgentContext } from "./agentContext";

interface CrewProposalChange {
  fileName: string;
  status: "new" | "modified" | "deleted";
  content?: string;
}

interface UseAgentCrewChatOptions {
  specialists: AgentSpecialist[];
  scripts: CrewSpecialistScript[];
  initialSpecialistId: string;
  /** Current full project tree (with any pending proposedContent). */
  tree: FileItem[];
  /** Whether Specs/SPEC.md currently exists in the project tree. */
  specExists: boolean;
  levelInstructionsMarkdown: string;
  /** True when a tutor API key is configured — switches scripted → live runs. */
  liveMode: boolean;
  beginAiProposal: (changes: CrewProposalChange[]) => void;
  acceptAiProposal: () => FileItem[];
  rejectAiProposal: () => void;
}

/**
 * Chat engine for the specialist-agents level. One surface, two backends:
 *
 * - live (API key set): each turn runs through the real tutor pipeline via
 *   runSpecialistTurn — pruned context, per-agent contract, clamped writes.
 *   Each agent keeps its OWN conversation slice; switching agents never leaks
 *   another agent's thread into the model call.
 * - scripted (no key): keyword-matched replies from crewScripts.
 *
 * Both backends stage proposals on the real file tree (beginAiProposal), so
 * the file manager badges, pending preview, and accept/reject flow are the
 * harness's own.
 */
export function useAgentCrewChat({
  specialists,
  scripts,
  initialSpecialistId,
  tree,
  specExists,
  levelInstructionsMarkdown,
  liveMode,
  beginAiProposal,
  acceptAiProposal,
  rejectAiProposal,
}: UseAgentCrewChatOptions) {
  const initialAgent = specialists.find((s) => s.id === initialSpecialistId);
  const initialScript = scripts.find(
    (s) => s.specialistId === initialSpecialistId,
  );

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    initialScript
      ? [{ role: "assistant", content: initialScript.opening }]
      : [],
  );
  const [chatInput, setChatInput] = useState("");
  const [activeId, setActiveId] = useState(initialSpecialistId);
  const [unlockedIds, setUnlockedIds] = useState<ReadonlySet<string>>(
    () => new Set(specialists.filter((s) => s.unlocked).map((s) => s.id)),
  );
  const [customizations, setCustomizations] = useState<
    Record<string, AgentCustomization>
  >({});

  /** Authored specialists with student customizations applied. */
  const effectiveSpecialists = useMemo(
    () =>
      specialists.map((specialist) =>
        applyCustomization(specialist, customizations[specialist.id]),
      ),
    [specialists, customizations],
  );
  const effectiveSpecialistsRef = useRef(effectiveSpecialists);
  effectiveSpecialistsRef.current = effectiveSpecialists;

  const setAgentCustomization = useCallback(
    (agentId: string, customization: AgentCustomization) => {
      setCustomizations((current) => ({
        ...current,
        [agentId]: customization,
      }));
    },
    [],
  );

  // Refs so memoized handlers always see current state.
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const treeRef = useRef(tree);
  treeRef.current = tree;
  const specExistsRef = useRef(specExists);
  specExistsRef.current = specExists;
  const usedRuleIdsRef = useRef<Set<string>>(new Set());
  const greetedIdsRef = useRef<Set<string>>(
    new Set(initialAgent ? [initialAgent.id] : []),
  );
  /** Per-agent conversation slices — live runs only ever see their own. */
  const agentThreadsRef = useRef<Record<string, ChatMessage[]>>({});
  const pendingProposalKeyRef = useRef<CrewProposalKey | null>(null);
  const hasUnlockedA11yRef = useRef(false);

  const findSpecialist = useCallback(
    (id: string) => effectiveSpecialistsRef.current.find((s) => s.id === id),
    [],
  );

  const appendMessages = useCallback((messages: ChatMessage[]) => {
    setChatMessages((current) => [...current, ...messages]);
  }, []);

  const buildHandOffCard = useCallback(
    (handOffTo: { agentId: string; reason: string }) => {
      const target = findSpecialist(handOffTo.agentId);
      if (!target) return undefined;
      return {
        agentId: target.id,
        label: target.role,
        iconName: target.iconName,
        reason: handOffTo.reason,
      };
    },
    [findSpecialist],
  );

  const receiptForActiveAgent = useCallback(() => {
    const specialist = findSpecialist(activeIdRef.current);
    if (!specialist) return undefined;
    return packedContextPaths(treeRef.current, specialist);
  }, [findSpecialist]);

  const scriptedReplyToMessage = useCallback(
    (reply: CrewScriptedReply): ChatMessage => {
      const base: ChatMessage = {
        role: "assistant",
        content: reply.text,
        agentContextReceipt: receiptForActiveAgent(),
        ...(reply.handOffTo
          ? { agentHandOff: buildHandOffCard(reply.handOffTo) }
          : {}),
      };
      if (reply.proposal) {
        pendingProposalKeyRef.current = reply.proposal.key;
        beginAiProposal(reply.proposal.changes);
        return {
          ...base,
          fileChanges: reply.proposal.fileChanges,
          codeChangeStatus: "pending",
          aiSaveTitle: reply.proposal.saveTitle,
        };
      }
      return base;
    },
    [beginAiProposal, buildHandOffCard, receiptForActiveAgent],
  );

  /** Scripted backend — used when no API key is configured. */
  const mockTutorConfig = useMemo<MockTutorConfig>(
    () => ({
      response: (input: string): ChatMessage => {
        const script = scripts.find(
          (s) => s.specialistId === activeIdRef.current,
        );
        if (!script) {
          return { role: "assistant", content: "No agent is active." };
        }
        const normalized = input.toLowerCase();
        const hasSpec = specExistsRef.current;

        for (const rule of script.rules) {
          if (rule.requiresSpec && !hasSpec) continue;
          if (rule.requiresNoSpec && hasSpec) continue;
          const ruleKey = `${script.specialistId}:${rule.id}`;
          if (rule.once && usedRuleIdsRef.current.has(ruleKey)) continue;
          if (!rule.keywords.some((keyword) => normalized.includes(keyword))) {
            continue;
          }
          usedRuleIdsRef.current.add(ruleKey);
          return scriptedReplyToMessage(rule.reply);
        }

        const fallback =
          hasSpec && script.fallbackWithSpec
            ? script.fallbackWithSpec
            : script.fallback;
        return {
          role: "assistant",
          content: fallback,
          agentContextReceipt: receiptForActiveAgent(),
        };
      },
    }),
    [scripts, scriptedReplyToMessage, receiptForActiveAgent],
  );

  /** Live backend — real tutor pipeline with the agent's pruned context. */
  const onTutorSubmit = useCallback<TutorSubmitHandler>(
    async (message) => {
      const specialist = findSpecialist(activeIdRef.current);
      if (!specialist) return undefined;

      const thread = agentThreadsRef.current[specialist.id] ?? [];
      const { chatMessage, proposalChanges } = await runSpecialistTurn({
        specialist,
        message,
        conversation: thread,
        files: treeRef.current,
        levelInstructionsMarkdown,
      });

      agentThreadsRef.current[specialist.id] = [
        ...thread,
        { role: "user", content: message },
        { role: "assistant", content: chatMessage.content },
      ];

      if (proposalChanges.length > 0) {
        // Live proposals share the generic follow-up path (first-accept unlock).
        pendingProposalKeyRef.current = null;
        beginAiProposal(
          proposalChanges.map((change) => ({
            fileName: change.fileName,
            status: change.status,
            content: change.content,
          })),
        );
      }
      return chatMessage;
    },
    [beginAiProposal, findSpecialist, levelInstructionsMarkdown],
  );

  const selectAgent = useCallback(
    (id: string) => {
      if (id === activeIdRef.current) return;
      if (!unlockedIds.has(id)) return;
      const specialist = findSpecialist(id);
      const script = scripts.find((s) => s.specialistId === id);
      if (!specialist) return;

      const messages: ChatMessage[] = [
        {
          role: "assistant",
          content: "",
          agentDivider: {
            label: specialist.role,
            iconName: specialist.iconName,
            accent: specialist.accent,
            detail: "fresh context",
            title: buildSwitchNote(
              specialist.role,
              describeAgentContext(specialist),
            ),
          },
        },
      ];
      if (script && !greetedIdsRef.current.has(id)) {
        greetedIdsRef.current.add(id);
        const opening =
          specExistsRef.current && script.openingWithSpec
            ? script.openingWithSpec
            : script.opening;
        messages.push({
          role: "assistant",
          content: opening,
          agentContextReceipt: packedContextPaths(treeRef.current, specialist),
        });
      }
      appendMessages(messages);
      setActiveId(id);
    },
    [appendMessages, findSpecialist, scripts, unlockedIds],
  );

  const handleAcceptAiChanges = useCallback(() => {
    acceptAiProposal();
    const proposalKey = pendingProposalKeyRef.current;
    pendingProposalKeyRef.current = null;

    // The panel appends its own "accepted" alert synchronously after this
    // callback; defer follow-ups so they land after it instead of being
    // overwritten by the panel's stale-array write.
    const followUps: ChatMessage[] = [];
    if (proposalKey) {
      const followUp = crewAcceptFollowUps[proposalKey];
      followUps.push({
        role: "assistant",
        content: followUp.text,
        ...(followUp.handOffTo
          ? { agentHandOff: buildHandOffCard(followUp.handOffTo) }
          : {}),
      });
    }
    if (!hasUnlockedA11yRef.current && proposalKey !== "gallery-spec") {
      hasUnlockedA11yRef.current = true;
      if (!unlockedIds.has("a11y")) {
        followUps.push({
          role: "assistant",
          content: "",
          agentDivider: {
            label: "Accessibility checker",
            iconName: "universal-access",
            accent: "green",
            detail: "new agent unlocked",
            title: a11yUnlockNote,
          },
        });
        setUnlockedIds((current) => {
          const next = new Set(current);
          next.add("a11y");
          return next;
        });
      }
    }
    if (followUps.length > 0) {
      window.setTimeout(() => appendMessages(followUps), 400);
    }
  }, [acceptAiProposal, appendMessages, buildHandOffCard, unlockedIds]);

  const handleRejectAiChanges = useCallback(() => {
    pendingProposalKeyRef.current = null;
    rejectAiProposal();
  }, [rejectAiProposal]);

  const hasPendingAiChanges = chatMessages.some(
    (message) => message.codeChangeStatus === "pending",
  );

  const activeSpecialist =
    effectiveSpecialists.find((s) => s.id === activeId) ??
    effectiveSpecialists[0];
  // Prefix on the cycling thinking animation — just the role; the animation
  // supplies the verb and the post-reply receipt shows what was read.
  const thinkingLabel = activeSpecialist?.role;

  return {
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    activeId,
    activeSpecialist,
    effectiveSpecialists,
    customizations,
    setAgentCustomization,
    unlockedIds,
    selectAgent,
    thinkingLabel,
    mockTutorConfig: liveMode ? undefined : mockTutorConfig,
    onTutorSubmit: liveMode ? onTutorSubmit : undefined,
    handleAcceptAiChanges,
    handleRejectAiChanges,
    hasPendingAiChanges,
  };
}
