import { useMemo, useState } from "react";
import { Lab2Shell } from "../../components/lab2/Lab2Shell";
import {
  Workspace,
  CreateFileModal,
} from "../../components/ide/weblab2/views";
import {
  buildPreviewSrcDoc,
  getPreviewHtmlFiles,
} from "../../components/ide/weblab2/views/buildPreviewSrcDoc";
import { MarkdownInstructions } from "../../components/lab2/resource-panel/MarkdownInstructions";
import { AgentRosterStrip } from "../../components/agentic/crew/AgentRosterStrip";
import { AgentDetailModal } from "../../components/agentic/crew/AgentDetailModal";
import { useAgentCrewChat } from "../../components/agentic/crew/useAgentCrewChat";
import {
  buildAgenticStarterTree,
  crewScripts,
  crewSpecialists,
} from "../../data/agentic";
import { useFileWorkspaceState } from "../../hooks/useFileWorkspaceState";
import { useLayoutState } from "../../hooks/useLayoutState";
import { useTutorApiSettings } from "../../hooks/useTutorApiSettings";
import { useVersionHistoryState } from "../../hooks/useVersionHistoryState";
import { useShareAwareNavigate } from "../../hooks/useLevelShareMode";
import { agenticProgressionLinks } from "../levelTypeLinks";
import type { FileItem } from "../../types/file";

const instructionsMarkdown = `# Working with specialist agents

Your portfolio's **project gallery** needs styling — the cards currently stack
in a plain column.

This level adds **specialist agents** to the AI panel. Each agent has one job
and a small, visible **context window**: switch agents in the bar above the
composer, and use ⓘ to inspect what the active one can and can't see.

1. Ask the **Tutor** what's wrong with the gallery.
2. Have the **Spec writer** draft \`Specs/SPEC.md\` — notice it can't see your code.
3. Hand off to the **Style agent** — it builds from the spec, not your chat.
4. Review each proposed change, then accept or reject it. You decide what ships.
`;

function treeHasSpec(tree: FileItem[]): boolean {
  for (const item of tree) {
    if (item.type === "folder" && item.name === "Specs") {
      return Boolean(item.children?.some((child) => child.name === "SPEC.md"));
    }
    if (item.children && treeHasSpec(item.children)) return true;
  }
  return false;
}

/** Project files a student can scope into an agent (artifacts stay fixed). */
function collectScopableFiles(tree: FileItem[]): string[] {
  const paths: string[] = [];
  const walk = (items: FileItem[], parentPath: string) => {
    for (const item of items) {
      const path = parentPath ? `${parentPath}/${item.name}` : item.name;
      if (item.type === "folder" && item.children) {
        if (item.name !== "Specs") walk(item.children, path);
      } else {
        paths.push(path);
      }
    }
  };
  for (const root of tree) walk(root.children ?? [], "");
  return paths;
}

function collectProposedChanges(
  tree: FileItem[],
): Record<string, "new" | "modified" | "deleted"> {
  const changes: Record<string, "new" | "modified" | "deleted"> = {};
  const walk = (items: FileItem[]) => {
    for (const item of items) {
      if (item.children) walk(item.children);
      else if (item.proposedStatus) changes[item.name] = item.proposedStatus;
    }
  };
  walk(tree);
  return changes;
}

export function AgenticCrewLevelPage() {
  const navigate = useShareAwareNavigate();
  const initialTree = useMemo(() => buildAgenticStarterTree(), []);
  const { hasApiKey } = useTutorApiSettings();
  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState();
  const {
    fileStructureState,
    openFolders,
    selectedFile,
    openFiles,
    viewMode,
    isFileManagerCollapsed,
    isCreateFileModalOpen,
    setSelectedFile,
    setViewMode,
    setIsFileManagerCollapsed,
    setIsCreateFileModalOpen,
    toggleFolder,
    openFile,
    closeFile,
    handleReorderFiles,
    handleCreateFile,
    moveFileTreeItem,
    updateFileContent,
    beginAiProposal,
    acceptAiProposal,
    rejectAiProposal,
  } = useFileWorkspaceState(initialTree, { initialViewMode: "split" });
  const {
    selectedHistoryVersion,
    setSelectedHistoryVersion,
    showRestoreSuccessAlert,
    setShowRestoreSuccessAlert,
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    handleSaveVersion,
    handleRestoreVersion,
    handleReturnToCurrentVersion,
  } = useVersionHistoryState();

  const tree = fileStructureState ?? initialTree;
  const specExists = treeHasSpec(tree);

  const crew = useAgentCrewChat({
    specialists: crewSpecialists,
    scripts: crewScripts,
    initialSpecialistId: "tutor",
    tree,
    specExists,
    levelInstructionsMarkdown: instructionsMarkdown,
    liveMode: hasApiKey,
    beginAiProposal,
    acceptAiProposal,
    rejectAiProposal,
  });

  const aiChangedFiles = useMemo(() => collectProposedChanges(tree), [tree]);
  const scopableFiles = useMemo(() => collectScopableFiles(tree), [tree]);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [previewPath, setPreviewPath] = useState("index.html");
  const previewSrcDoc = useMemo(
    () => buildPreviewSrcDoc(tree, crew.hasPendingAiChanges, previewPath),
    [tree, crew.hasPendingAiChanges, previewPath],
  );
  const previewHtmlFiles = useMemo(
    () => getPreviewHtmlFiles(tree, crew.hasPendingAiChanges),
    [tree, crew.hasPendingAiChanges],
  );

  return (
    <>
      <Lab2Shell
        topNavigationProps={{
          title: "Web Lab 2: Style the Project Gallery",
          subtitle: hasApiKey
            ? "Specialist agents — live tutor runs"
            : "Saved a few seconds ago",
          currentLevel: 1,
          totalLevels: 2,
          levelLinks: agenticProgressionLinks,
          currentLevelPath: "/levels/agentic-crew",
        }}
        sidebarProps={{
          activeTab,
          setActiveTab,
          sidebarWidth,
          isSettingsOpen,
          setIsSettingsOpen,
          chatMessages: crew.chatMessages,
          setChatMessages: crew.setChatMessages,
          chatInput: crew.chatInput,
          setChatInput: crew.setChatInput,
          aiTutorAgentStrip: (
            <AgentRosterStrip
              specialists={crew.effectiveSpecialists}
              activeId={crew.activeId}
              unlockedIds={crew.unlockedIds}
              onSelect={crew.selectAgent}
              onOpenDetails={() => setAgentModalOpen(true)}
              disabled={crew.hasPendingAiChanges}
            />
          ),
          onAgentHandOff: crew.selectAgent,
          aiTutorThinkingLabel: crew.thinkingLabel,
          mockTutorConfig: crew.mockTutorConfig,
          onTutorSubmit: crew.onTutorSubmit,
          onAcceptAiChanges: crew.handleAcceptAiChanges,
          onRejectAiChanges: crew.handleRejectAiChanges,
          hasPendingAiChanges: crew.hasPendingAiChanges,
          showInstructionsDrawer: true,
          instructionsDrawerDefaultOpen: false,
          showInstructionsTab: true,
          instructionsContent: (
            <MarkdownInstructions markdown={instructionsMarkdown} />
          ),
          aiTutorComposerPlaceholder: "Message the active agent…",
          selectedHistoryVersion,
          setSelectedHistoryVersion,
          onSaveVersion: handleSaveVersion,
          onRestoreVersion: handleRestoreVersion,
          showRestoreSuccessAlert,
          setShowRestoreSuccessAlert,
          showSaveSuccessAlert,
          setShowSaveSuccessAlert,
          onContinue: () => navigate("/levels/agentic-mission"),
          continueLabel: "Continue to Mission Control",
        }}
        onResize={(delta) => {
          setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
        }}
      >
        <Workspace
          viewMode={viewMode}
          setViewMode={setViewMode}
          fileStructure={tree}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          openFiles={openFiles}
          openFolders={openFolders}
          toggleFolder={toggleFolder}
          openFile={openFile}
          closeFile={closeFile}
          handleReorderFiles={handleReorderFiles}
          isFileManagerCollapsed={isFileManagerCollapsed}
          setIsFileManagerCollapsed={setIsFileManagerCollapsed}
          setIsCreateFileModalOpen={setIsCreateFileModalOpen}
          onMoveFileTreeItem={moveFileTreeItem}
          onFileContentChange={updateFileContent}
          aiChangedFiles={aiChangedFiles}
          onAcceptAiChanges={crew.handleAcceptAiChanges}
          onRejectAiChanges={crew.handleRejectAiChanges}
          preview={{
            kind: "file",
            srcDoc: previewSrcDoc,
            path: previewPath,
            htmlFiles: previewHtmlFiles,
            onPathChange: setPreviewPath,
            showDesignTools: false,
          }}
          selectedHistoryVersion={selectedHistoryVersion}
          onReturnToCurrentVersion={handleReturnToCurrentVersion}
        />
      </Lab2Shell>

      <CreateFileModal
        isOpen={isCreateFileModalOpen}
        onClose={() => setIsCreateFileModalOpen(false)}
        onCreate={handleCreateFile}
      />

      {crew.activeSpecialist && (
        <AgentDetailModal
          open={agentModalOpen}
          onClose={() => setAgentModalOpen(false)}
          specialist={crew.activeSpecialist}
          baseSpecialist={
            crewSpecialists.find((s) => s.id === crew.activeId) ??
            crew.activeSpecialist
          }
          allProjectFiles={scopableFiles}
          allowCustomization
          liveMode={hasApiKey}
          onSave={(customization) =>
            crew.setAgentCustomization(crew.activeId, customization)
          }
        />
      )}
    </>
  );
}
