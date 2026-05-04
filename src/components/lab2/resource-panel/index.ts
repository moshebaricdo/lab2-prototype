export { Sidebar } from "./Sidebar";
export type { SidebarTab, SidebarProps } from "./Sidebar.types";
/** Alias for the resource / sidebar chrome (same component as `Sidebar`). */
export { Sidebar as ResourcePanel } from "./Sidebar";
export type { SidebarProps as ResourcePanelProps } from "./Sidebar.types";

export { ContinueButton } from "./ContinueButton";
export { InstructionsDrawer } from "./InstructionsDrawer";
export { PythonLabInstructions } from "./PythonLabInstructions";
export { SettingsPanel } from "./views/SettingsPanel";
export { ValidationPanel } from "./views/ValidationPanel";
export { VersionHistory } from "./views/VersionHistory";
export { InstructionsPanel } from "./views/InstructionsPanel";

export { AiTutorPanel } from "./views/ai-tutor/AiTutorPanel";
export { TeacherResourcesPanel } from "./views/TeacherResourcesPanel";
export { RubricPanel } from "./views/RubricPanel";
export { ResourcesPanel } from "./views/ResourcesPanel";
export type {
  RubricData,
  RubricCategory,
  RubricSubmissionStatus,
} from "./views/RubricPanel";
