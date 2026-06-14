import { useBackpack } from "../../../hooks/BackpackContext";
import {
  createAgentBackpackItem,
  mergeAgentBackpackItem,
} from "../../../lib/backpack/agentBackpack";
import type { AgentCustomization, AgentSpecialist } from "../../../types/agentLab";
import { AgentDetailModal } from "./AgentDetailModal";
import type { useAgentLevelState } from "./useAgentLevelState";

type AgentLevelState = ReturnType<typeof useAgentLevelState>;

interface AgentLevelModalsProps {
  agents: AgentLevelState;
  scopableProjectFiles: string[];
  planPath?: string;
  hasLevelInstructions?: boolean;
  baseSpecialistForActive: AgentSpecialist;
  agentModalOpen: boolean;
  onAgentModalOpenChange: (open: boolean) => void;
  agentCreateDraft: AgentSpecialist | null;
  onAgentCreateDraftChange: (draft: AgentSpecialist | null) => void;
}

/**
 * Agent detail/create modals wired to backpack I/O. Lives inside
 * `BackpackProvider` so save/create can persist without a secondary dialog.
 */
export function AgentLevelModals({
  agents,
  scopableProjectFiles,
  planPath,
  hasLevelInstructions = false,
  baseSpecialistForActive,
  agentModalOpen,
  onAgentModalOpenChange,
  agentCreateDraft,
  onAgentCreateDraftChange,
}: AgentLevelModalsProps) {
  const { addBackpackItem, items, replaceBackpackItem } = useBackpack();

  const syncBackpackSnapshot = (agentId: string, effective: AgentSpecialist) => {
    const backpackId = agents.getBackpackSourceId(agentId);
    if (!backpackId) return;
    const item = items.find((entry) => entry.id === backpackId);
    if (!item) return;
    replaceBackpackItem(backpackId, mergeAgentBackpackItem(item, effective));
  };

  const handleSave = (
    agentId: string,
    customization: AgentCustomization,
    effective: AgentSpecialist,
  ) => {
    if (Object.keys(customization).length === 0) {
      agents.setAgentCustomization(agentId, {});
    } else {
      agents.setAgentCustomization(agentId, customization);
    }
    syncBackpackSnapshot(agentId, effective);
  };

  const modalOpen = agentModalOpen || agentCreateDraft !== null;
  const modalSpecialist = agentCreateDraft ?? agents.activeSpecialist;
  const isCreateMode = agentCreateDraft !== null;
  const activeId = agents.activeId;

  if (!agents.enabled || !modalSpecialist) return null;

  const allowIdentityEdit =
    isCreateMode || agents.recalledAgentIds.has(activeId);
  const allowAgentManagement =
    agents.allowCustomization || agents.allowAgentLibrary;

  return (
    <AgentDetailModal
      open={modalOpen}
      onClose={() => {
        onAgentCreateDraftChange(null);
        onAgentModalOpenChange(false);
      }}
      mode={isCreateMode ? "create" : "default"}
      specialist={modalSpecialist}
      baseSpecialist={
        isCreateMode ? modalSpecialist : baseSpecialistForActive
      }
      allProjectFiles={scopableProjectFiles}
      planPath={planPath}
      hasLevelInstructions={hasLevelInstructions}
      allowCustomization={isCreateMode || agents.allowCustomization}
      allowIdentityEdit={allowIdentityEdit}
      allowAgentLibrary={agents.allowAgentLibrary}
      onSave={(customization, effective) =>
        handleSave(activeId, customization, effective)
      }
      onCreate={(specialist) => {
        const item = createAgentBackpackItem(specialist);
        addBackpackItem(item);
        agents.addRecalledAgent(specialist, { backpackItemId: item.id });
        onAgentCreateDraftChange(null);
      }}
      onSaveToBackpack={(specialist) => {
        addBackpackItem(createAgentBackpackItem(specialist));
      }}
      canRemoveFromProject={
        allowAgentManagement &&
        !isCreateMode &&
        agents.canRemoveFromProject(activeId)
      }
      onRemoveFromProject={() => agents.removeAgentFromProject(activeId)}
    />
  );
}
