# Web Lab 2 - Architecture Overview

## Before Refactoring

```
/App.tsx (1400+ lines)
├── Imports (60+ lines)
├── SVG Components (Layer12, AiBot) (60 lines)
├── Mock Data (fileStructure, versionLabels, initialChatMessages) (300+ lines)
├── State Management (20 useState calls) (40 lines)
├── Event Handlers (10+ functions) (150 lines)
├── Top Navigation JSX (50 lines)
├── Sidebar JSX (200 lines)
│   ├── Tab Navigation
│   ├── Instructions Panel (150 lines)
│   ├── Validation Panel
│   ├── AI Tutor Panel (100 lines)
│   ├── Version History Panel (150 lines)
│   └── Teacher Resources Panel
├── Workspace JSX (300 lines)
│   ├── Header with view modes
│   ├── File Manager
│   ├── Code Editor
│   └── Preview Panel
└── Modals (CreateFileModal, SaveVersionPopover) (50 lines)
```

**Problems:**
- 🔴 Difficult to navigate and find specific code
- 🔴 Long file causes IDE performance issues
- 🔴 Hard to test individual features
- 🔴 Merge conflicts when multiple developers work on it
- 🔴 No clear separation of concerns
- 🔴 Reusability is limited

---

## After Refactoring

```
📁 /
├── 📄 App.tsx (180 lines) ⭐ Main orchestrator
│
├── 📁 data/
│   └── 📄 mockData.ts
│       ├── fileStructure (nested file tree)
│       ├── versionLabels (version display names)
│       └── initialChatMessages (seed data)
│
└── 📁 components/
    ├── 📄 TopNavigation.tsx
    │   ├── Logo
    │   ├── Lesson info
    │   ├── Progress bubbles
    │   └── User menu
    │
    ├── 📄 Sidebar.tsx (Main container)
    │   ├── Tab navigation (6 tabs)
    │   ├── Panel header
    │   ├── Panel content (conditional)
    │   ├── Continue button
    │   └── Settings panel
    │
    ├── 📄 Workspace.tsx
    │   ├── View mode header
    │   ├── File Manager
    │   ├── Code Editor
    │   ├── Resize handles
    │   └── Preview Panel
    │
    ├── 📁 panels/
    │   ├── 📄 InstructionsPanel.tsx
    │   ├── 📄 AiTutorPanel.tsx
    │   └── 📄 TeacherResourcesPanel.tsx
    │
    └── 📁 icons/
        ├── 📄 Logo.tsx
        └── 📄 AiBot.tsx
```

**Benefits:**
- ✅ Clear file organization by feature
- ✅ Fast IDE navigation and search
- ✅ Isolated component testing
- ✅ Reduced merge conflicts
- ✅ Single Responsibility Principle
- ✅ Easy to reuse components

---

## Component Hierarchy

```
App
│
├── TopNavigation
│
├── Sidebar
│   ├── SidebarTooltip (wraps each tab)
│   ├── TertiaryIconButton (bottom buttons)
│   ├── AiTutorIcon (custom brand icon)
│   ├── InstructionsPanel
│   │   └── ScrollArea
│   │       └── Instruction Cards
│   ├── ValidationPanel
│   │   └── Animated test results
│   ├── AiTutorPanel
│   │   ├── ScrollArea (messages)
│   │   ├── AiBot icon
│   │   ├── ActionRow (message actions)
│   │   ├── Textarea (input)
│   │   ├── SecondaryButton (Add File)
│   │   └── Send Button
│   ├── VersionHistory
│   │   ├── Version list
│   │   ├── Save form
│   │   └── Restore buttons
│   ├── TeacherResourcesPanel
│   │   └── Placeholder content
│   ├── ContinueButton
│   └── SettingsPanel (slide-up)
│
├── ResizableHandle (sidebar)
│
├── Workspace
│   ├── View Mode Toggle (Code/Preview/Split)
│   ├── Code Panel
│   │   ├── FileManager
│   │   │   ├── Collapse toggle
│   │   │   ├── Folder tree
│   │   │   └── New file dropdown
│   │   └── CodeEditor
│   │       ├── File tabs (drag-drop)
│   │       ├── Tab close buttons
│   │       └── Code content area
│   ├── ResizableHandle (split view)
│   └── PreviewPanel
│       ├── URL bar (editable)
│       ├── Device toggles
│       └── Preview iframe
│
├── CreateFileModal
│   ├── File name input
│   ├── File type dropdown
│   └── Create button
│
└── SaveVersionPopover
    ├── Description textarea
    └── Save button
```

---

## State Management Flow

### Centralized State in App.tsx

```typescript
// 🟢 Navigation
activeTab: "info" | "checklist" | "ai-tutor" | "history" | "classroom"

// 🟢 File System
openFolders: Set<string>
selectedFile: FileItem | null
openFiles: FileItem[]

// 🟢 View
viewMode: "code" | "preview" | "split"
isFileManagerCollapsed: boolean

// 🟢 Chat
chatMessages: Array<{ role, content }>
chatInput: string

// 🟢 Version Control
selectedHistoryVersion: string

// 🟢 UI
isSettingsOpen: boolean
isCreateFileModalOpen: boolean
isSaveVersionModalOpen: boolean
showSavedTag: boolean
saveButtonRef: HTMLButtonElement | null

// 🟢 Layout
sidebarWidth: number (300-600px)
```

### Props Flow

```
App → Sidebar
  ✓ activeTab, setActiveTab
  ✓ sidebarWidth
  ✓ isSettingsOpen, setIsSettingsOpen
  ✓ chatMessages, setChatMessages
  ✓ chatInput, setChatInput
  ✓ selectedHistoryVersion, setSelectedHistoryVersion

App → Workspace
  ✓ viewMode, setViewMode
  ✓ fileStructure (from mockData)
  ✓ selectedFile, setSelectedFile
  ✓ openFiles, setOpenFiles
  ✓ openFolders, toggleFolder
  ✓ openFile, closeFile handlers
  ✓ isFileManagerCollapsed, setIsFileManagerCollapsed
  ✓ selectedHistoryVersion
  ✓ showSavedTag
  ✓ Modal triggers

Sidebar → AiTutorPanel
  ✓ chatMessages, setChatMessages
  ✓ chatInput, setChatInput

Sidebar → VersionHistory
  ✓ selectedHistoryVersion
  ✓ onVersionChange

Workspace → FileManager
  ✓ fileStructure, selectedFile, openFolders
  ✓ onFileSelect, onToggleFolder
  ✓ collapsed, onToggleCollapse
  ✓ onNewFile

Workspace → CodeEditor
  ✓ openFiles, selectedFile
  ✓ onFileSelect, onCloseFile, onReorderFiles
  ✓ isFileManagerCollapsed
  ✓ onCreateFile
```

---

## Data Flow Example: Opening a File

```
User clicks file in FileManager
    ↓
FileManager calls onFileSelect(file)
    ↓
Workspace calls openFile(file)
    ↓
App.openFile() handler:
  - setSelectedFile(file)
  - setOpenFiles([...openFiles, file]) if not already open
    ↓
State updates propagate:
  - Workspace receives new selectedFile
  - CodeEditor receives updated openFiles
  - CodeEditor highlights active tab
  - CodeEditor displays file content
```

---

## Event Handler Responsibilities

### App.tsx Handlers

```typescript
toggleFolder(folderPath)
  → Updates openFolders Set
  → Expands/collapses folder in FileManager

openFile(file)
  → Sets selected file
  → Adds to open files if new
  → Triggers CodeEditor tab creation

closeFile(file)
  → Removes from openFiles
  → Selects next file if current was closed
  → Updates CodeEditor tabs

handleReorderFiles(files)
  → Updates openFiles array order
  → Reflects drag-drop in CodeEditor

handleCreateFile(fileName, fileType)
  → Creates new FileItem
  → Adds to openFiles
  → Sets as selected
  → TODO: Add to fileStructure

handleSaveVersion(description)
  → Closes modal
  → Shows saved tag
  → Auto-hides after 2.5s
  → TODO: Save to backend
```

---

## Design System Integration

### Color Usage

```typescript
// Accent (Brand Teal)
"#0093a4" → Active states, focus rings, highlights

// Primary (Purple)
"#9657c7" → Primary buttons, send button
"#6c468a" → Hover state for primary buttons

// Borders
"#d4dae1" → Primary borders (panels, tabs)
"#b7c1cb" → Input borders, secondary borders

// Backgrounds
"#f0f2f5" → Inactive tabs, card backgrounds
"#dfe3e9" → Hover state backgrounds
"#e0f8f9" → Active/focus backgrounds
"#ebfffe" → AI message background

// Text
"#292f36" → Primary text
"#69788a" → Secondary text (labels, inactive icons)
"#424d59" → Description text
```

### Typography

```typescript
// Headings (Barlow Semi Condensed, 600 weight)
font-family: var(--font-heading)

// Body (Figtree, 400/500/600 weights)
font-family: var(--font-body)

// Code (Google Sans Code, monospace)
font-family: var(--font-mono) // Only in CodeEditor

// Never use Tailwind font classes:
❌ text-lg, text-xl, font-bold, font-semibold
✅ font-weight: var(--font-weight-semibold)
```

### Focus States

```typescript
// All interactive elements
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-[#0093a4]
focus-visible:ring-offset-2

// Input wrappers
focus-within:ring-2
focus-within:ring-[#0093a4]
focus-within:ring-offset-2
```

---

## Performance Considerations

### Current Implementation
- All components render on every App state change
- No memoization
- No lazy loading

### Optimization Opportunities

```typescript
// 1. Memoize expensive components
const MemoizedCodeEditor = React.memo(CodeEditor);
const MemoizedFileManager = React.memo(FileManager);

// 2. Lazy load panels
const AiTutorPanel = lazy(() => import('./panels/AiTutorPanel'));
const InstructionsPanel = lazy(() => import('./panels/InstructionsPanel'));

// 3. Use Context for global state
const AppStateContext = createContext();
const useAppState = () => useContext(AppStateContext);

// 4. Extract custom hooks
const useFileManager = () => {
  const [openFolders, setOpenFolders] = useState(...);
  const [selectedFile, setSelectedFile] = useState(...);
  // ... all file management logic
  return { openFolders, selectedFile, openFile, closeFile, ... };
};
```

---

## Testing Strategy

### Unit Tests

```typescript
// Component Tests
describe('Sidebar', () => {
  it('renders all tabs', ...);
  it('switches active tab on click', ...);
  it('shows correct panel for active tab', ...);
});

describe('Workspace', () => {
  it('switches view modes', ...);
  it('toggles file manager collapse', ...);
});

// Handler Tests
describe('App handlers', () => {
  it('opens file correctly', ...);
  it('closes file and selects next', ...);
  it('creates new file', ...);
});
```

### Integration Tests

```typescript
describe('File workflow', () => {
  it('opens file from FileManager to CodeEditor', ...);
  it('closes file tab and updates state', ...);
  it('reorders tabs via drag-drop', ...);
});

describe('Chat workflow', () => {
  it('sends message and updates history', ...);
  it('clears input after send', ...);
  it('disables send when input empty', ...);
});
```

---

## Deployment Checklist

Before deploying the refactored code:

- [ ] All imports resolve correctly
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] All interactive features work
- [ ] State persists correctly across tab switches
- [ ] Resize handles work smoothly
- [ ] Modals open/close properly
- [ ] Focus states visible on all elements
- [ ] Icons render correctly (FontAwesome)
- [ ] Typography follows design system
- [ ] Colors match design tokens
- [ ] Tooltips appear on hover
- [ ] Animations smooth (tab switching, settings panel)
- [ ] No performance regressions
- [ ] Bundle size acceptable

---

## Migration Guide for Developers

### Finding Old Code

| Old Location (App.tsx) | New Location |
|------------------------|--------------|
| Top bar JSX | `/components/TopNavigation.tsx` |
| Sidebar tabs JSX | `/components/Sidebar.tsx` (tabs section) |
| Instructions content | `/components/panels/InstructionsPanel.tsx` |
| AI chat JSX | `/components/panels/AiTutorPanel.tsx` |
| Version history JSX | Stays in `/components/VersionHistory.tsx` |
| Workspace header | `/components/Workspace.tsx` |
| File manager JSX | Stays in `/components/FileManager.tsx` |
| Code editor JSX | Stays in `/components/CodeEditor.tsx` |
| Mock data | `/data/mockData.ts` |
| Layer12 SVG | `/components/icons/Logo.tsx` |
| AiBot SVG | `/components/icons/AiBot.tsx` |
| State definitions | Still in `/App.tsx` |
| Event handlers | Still in `/App.tsx` |

### Adding a New Sidebar Tab

1. Add tab type to `SidebarTab` in `/components/Sidebar.tsx`
2. Add tab button in sidebar navigation section
3. Create panel component in `/components/panels/[Name]Panel.tsx`
4. Import panel in Sidebar.tsx
5. Add conditional render in panel content section
6. Update header label logic

### Adding State

1. Add state in `/App.tsx` under appropriate category comment
2. Pass to Sidebar or Workspace as needed
3. Create handler if state needs complex logic
4. Update component props interface

---

## Future Architecture Vision

```
/src
├── /app
│   └── App.tsx (routing, providers)
├── /features
│   ├── /sidebar
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── /workspace
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── /chat
│       ├── components/
│       ├── hooks/
│       └── types/
├── /shared
│   ├── /components (buttons, inputs, etc.)
│   ├── /hooks (useResizable, useLocalStorage)
│   ├── /types (global types)
│   └── /utils (helpers)
└── /data
    ├── mockData.ts
    └── api/ (future backend integration)
```

---

**Conclusion:** The refactored architecture provides a solid foundation for continued development with clear boundaries, maintainable code, and room for growth.
