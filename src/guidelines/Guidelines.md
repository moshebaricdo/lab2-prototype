# Web Lab 2 UI Prototype - Development Guidelines

## Overview
This is a fully interactive prototype of Web Lab 2, designed for testing small, iterative features and conducting user tests. The prototype features a resource panel/sidebar on the left and a main workspace on the right, with comprehensive state management and interactive components.

---

## Design System & Styling

### CSS Variables Architecture
**CRITICAL:** All styling must use CSS variables defined in `/styles/globals.css`. This ensures:
- Consistent design system adherence across all components
- Easy theme updates by modifying the CSS file
- Centralized control over colors, spacing, typography, borders, and radius

### Color Tokens
Use these CSS variables for all color styling:
```css
--background, --foreground
--card, --card-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--accent, --accent-foreground
--muted, --muted-foreground
--destructive, --destructive-foreground
--border, --input, --input-background
--ring (focus state)
```

**Color Reference:**
- **Accent/Brand Color:** `#0093a4` (Teal) - Used for active states, highlights, focus rings
- **Primary:** `#9657c7` (Purple) - Primary buttons and CTAs
- **Borders:** `#d4dae1`, `#b7c1cb` - Different border contexts
- **Backgrounds:** `#f0f2f5`, `#dfe3e9`, `#e0f8f9` - Various background layers

### Typography System
**DO NOT** add Tailwind font size, weight, or line-height classes unless explicitly changing typography!

**Font Families:**
- **Heading:** `var(--font-heading)` - 'Barlow Semi Condensed' (600 weight only)
- **Body:** `var(--font-body)` - 'Figtree' (400, 500, 600 weights)
- **Code/Monospace:** `var(--font-mono)` - 'Google Sans Code' (for code editor only)

**Typography Scale:**
```css
--text-h1: 48px
--text-h2: 34px
--text-h3: 28px
--text-h4: 24px
--text-base: 16px
--text-label: 12px
```

**Font Weights:**
```css
--font-weight-semibold: 600
--font-weight-medium: 500
--font-weight-normal: 400
```

**Usage Example:**
```tsx
style={{
  fontFamily: "var(--font-body)",
  fontWeight: "var(--font-weight-semibold)",
}}
```

### Focus States
**Brand Focus State:** All interactive elements use a consistent focus state:
- **2px teal outline/ring** with **2px offset**
- Implementation: `focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2`
- Use `focus-within:` for container elements (like input wrappers)

### Spacing & Layout
- Use Tailwind spacing classes (p-2, gap-4, etc.)
- Border radius: `rounded-[4px]` for buttons/inputs, `rounded-[8px]` for cards/modals
- Transitions: Always add `transition-colors` for hover states

---

## Icon System

### FontAwesome 7 (NOT Lucide)
**IMPORTANT:** This project uses FontAwesome 7 icons exclusively.

**Import Pattern:**
```tsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIconName } from "@fortawesome/free-solid-svg-icons";
// OR
import { faIconName } from "@fortawesome/free-brands-svg-icons";
```

**Usage:**
```tsx
<FontAwesomeIcon icon={faIconName} className="w-4 h-4" />
```

**Common Icons:**
- Navigation: `faChevronDown`, `faChevronLeft`, `faChevronRight`, `faBars`
- Actions: `faPlus`, `faSave`, `faDownload`, `faEraser`, `faRotate`
- Views: `faCode`, `faEye`, `faColumns`
- Files: `faFileCode`, `faFolder`, `faFile`, `faImage`
- UI: `faXmark`, `faGear`, `faCircleInfo`, `faClipboardCheck`

---

## Component Architecture

### Directory Structure
```
/components         - Custom reusable components
/components/ui      - ShadCN UI components (DO NOT MODIFY structure)
/components/figma   - Protected Figma components (DO NOT MODIFY)
/imports            - Imported Figma design components
/styles             - Global CSS and design tokens
```

### Key Components

#### 1. Sidebar Navigation System (`/App.tsx`)
- **6 Tab States:** Info, Validation, AI Tutor, Version History, Teacher Resources, Settings
- **Active State Indicator:** 1px left border with accent color
- **Tab Icons:** FontAwesome icons with color transitions
- **Active:** `text-accent` | **Inactive:** `text-[#69788a]`
- **Background:** Active = `bg-white` | Inactive = `bg-[#f0f2f5]`

#### 2. File Manager (`/components/FileManager.tsx`)
- Collapsible sidebar (200px → 32px)
- Nested folder structure with expand/collapse
- File type icons (HTML, CSS, JS, etc.)
- Dropdown menu for new file creation
- Context menu support (right-click)

#### 3. Code Editor (`/components/CodeEditor.tsx`)
- Tab-based file management
- Drag-and-drop tab reordering
- Close buttons on tabs (X icon)
- Empty state with "Create new file" CTA
- Syntax highlighting via CSS classes
- Uses `Google Sans Code` font (monospace)

#### 4. Create File Modal (`/components/CreateFileModal.tsx`)
- File name input with brand focus state
- File type dropdown (HTML, CSS, JS, MD, TXT, CSV)
- Dropdown button shows selected file type icon
- Dynamic button label: "Create [name.extension]"
- Keyboard shortcuts: Enter to create, Escape to close

#### 5. AI Chat (`/App.tsx` - ai-tutor tab)
- Message history with user/assistant roles
- Action row for each AI message (copy, download, thumbs up/down)
- Input with "Add File" button and AI indicator
- Auto-scrolling chat area
- Purple send button (enabled only when input has text)

#### 6. Version History (`/components/VersionHistory.tsx`)
- List of saved versions with timestamps
- Version selection (highlights selected)
- Current version vs historical versions
- Save version form (description + button)
- Restore/Cancel buttons for historical versions

#### 7. Validation Panel (`/components/ValidationPanel.tsx`)
- Animated test results
- Status icons (success, error, warning, loading)
- Collapsible test groups
- Progress indicators

#### 8. Preview Panel (`/components/PreviewPanel.tsx`)
- URL bar with click-to-edit functionality
- Device size toggles (desktop, mobile, tablet)
- Fullscreen mode
- Refresh/reload controls

#### 9. Resizable Panels (`/components/ResizableHandle.tsx`)
- Vertical drag handles between panels
- Min/max width constraints
- Split view 50/50 by default
- Smooth resize transitions

#### 10. Settings Panel (`/components/SettingsPanel.tsx`)
- Slides up from bottom
- Overlay with backdrop
- Persistent across tab switches

---

## State Management

### Core State Variables (from `/App.tsx`)
```tsx
// Navigation
const [activeTab, setActiveTab] = useState("info");

// File Management
const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(["My Project"]));
const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
const [openFiles, setOpenFiles] = useState<FileItem[]>([]);

// View Modes
const [viewMode, setViewMode] = useState<"code" | "preview" | "split">("code");
const [isFileManagerCollapsed, setIsFileManagerCollapsed] = useState(false);

// UI State
const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
const [isSettingsOpen, setIsSettingsOpen] = useState(false);

// Resizing
const [sidebarWidth, setSidebarWidth] = useState(400); // 56px tabs + 344px content
const [splitViewCodeWidth, setSplitViewCodeWidth] = useState<number | null>(null);

// AI Chat
const [chatMessages, setChatMessages] = useState([...]);
const [chatInput, setChatInput] = useState("");

// Version History
const [selectedHistoryVersion, setSelectedHistoryVersion] = useState("current");
const [versionDescription, setVersionDescription] = useState("");
```

### State Flow Patterns
1. **File Selection:** FileManager → openFile() → setSelectedFile() + update openFiles
2. **Tab Switching:** Sidebar tabs → setActiveTab() → conditional panel render
3. **View Modes:** Workspace header → setViewMode() → panel visibility logic
4. **Modal Triggers:** Multiple entry points → setIsCreateFileModalOpen(true)

---

## Testing & Iteration Best Practices

### When Testing New Features
1. **Preserve Existing State:** Don't remove working state management
2. **Use CSS Variables:** Always reference design tokens from globals.css
3. **Test Focus States:** Ensure 2px teal ring on all interactive elements
4. **Check Responsiveness:** Test sidebar collapse, panel resizing, split view
5. **Verify Icons:** Confirm FontAwesome icons render correctly
6. **Typography Check:** Ensure no hard-coded font sizes/weights (unless intentional)

### What You Can Change
✅ Add new sidebar tabs and panels
✅ Extend file types and syntax highlighting
✅ Add new modal dialogs (follow CreateFileModal pattern)
✅ Enhance AI chat features
✅ Add validation rules/tests
✅ Customize preview panel features

### What to Preserve
❌ Do NOT modify `/components/ui/*` (ShadCN components)
❌ Do NOT modify `/components/figma/*` (Protected)
❌ Do NOT change CSS variable names in globals.css
❌ Do NOT replace FontAwesome with other icon libraries
❌ Do NOT hard-code colors (use CSS variables)
❌ Do NOT override typography scale (use variables)

---

## Common Patterns & Snippets

### Button Pattern (Primary)
```tsx
<button className="bg-[#9657c7] box-border content-stretch flex gap-[8px] items-center justify-center min-w-[40px] px-[16px] py-[8px] relative rounded-[4px] shrink-0 hover:bg-[#6c468a] active:bg-[#9657c7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2">
  <p className="leading-[21.56px] not-italic relative shrink-0 text-[14px] text-center text-white"
     style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-semibold)" }}>
    Button Text
  </p>
</button>
```

### Input Field Pattern
```tsx
<div className="bg-white relative rounded-[4px] shrink-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-[#0093a4] focus-within:ring-offset-2">
  <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
  <div className="size-full">
    <div className="box-border content-stretch flex gap-[10px] items-start px-[12px] py-[8px] relative w-full">
      <input
        type="text"
        placeholder="Placeholder text"
        className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[16px] bg-transparent border-0 outline-none placeholder:text-[#b7c1cb] text-[#292f36] leading-[23.68px]"
        style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}
      />
    </div>
  </div>
</div>
```

### Sidebar Tab Pattern
```tsx
<button
  onClick={() => setActiveTab("tab-name")}
  className={`h-14 flex items-center justify-center border-b border-[#d4dae1] relative transition-colors hover:bg-white ${
    activeTab === "tab-name" ? "bg-white" : "bg-[#f0f2f5]"
  }`}
>
  <FontAwesomeIcon
    icon={faIconName}
    className={`text-[18px] transition-colors ${
      activeTab === "tab-name" ? "text-accent" : "text-[#69788a] group-hover:text-[#576575]"
    }`}
  />
  {activeTab === "tab-name" && (
    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
  )}
</button>
```

---

## Keyboard Shortcuts & Interactions

### Implemented Shortcuts
- **Enter:** Submit forms (create file, send chat message)
- **Escape:** Close modals and dialogs
- **Click outside:** Close dropdowns and context menus

### Drag & Drop
- **File Tabs:** Reorderable via drag-and-drop
- **Panel Handles:** Draggable resize handles with constraints

### Click Interactions
- **File Manager:** Single click to open file
- **Tabs:** Click to switch, click X to close
- **Dropdown:** Click to open, click outside to close
- **Preview URL Bar:** Click to edit URL

---

## User Testing Considerations

### Performance
- File structure limited to ~20 files for prototype speed
- Chat history capped at recent messages
- Version history shows 7 versions max

### Mock Data
- File content is static (stored in component state)
- Version timestamps are hardcoded labels
- AI responses are pre-defined (not connected to real API)

### Known Limitations
- No actual file system persistence
- No real backend/database
- Settings panel doesn't save preferences
- Preview doesn't execute real code

---

## Quick Start for New Features

### Adding a New Sidebar Panel
1. Add icon import and state check in `/App.tsx`
2. Add tab button in sidebar with active/inactive states
3. Add conditional content panel with `{activeTab === "new-tab" && <Content />}`
4. Update header label in workspace header section
5. Test tab switching and state persistence

### Adding a New Modal
1. Create component in `/components/[ModalName].tsx`
2. Follow `CreateFileModal.tsx` pattern:
   - Use brand focus states
   - Include backdrop overlay
   - Add enter/escape keyboard handlers
   - Use CSS variables for all styling
3. Add state in `/App.tsx`: `const [isModalOpen, setIsModalOpen] = useState(false)`
4. Render at bottom of App component
5. Wire up trigger buttons

### Extending File Types
1. Update `FileType` type in relevant components
2. Add icon mapping in `FILE_TYPE_ICONS`
3. Update file extension mapping
4. Add syntax highlighting CSS if needed

---

## Troubleshooting

### Common Issues

**Typography not matching design:**
- ✓ Check that you're using CSS variables: `fontFamily: "var(--font-body)"`
- ✓ Don't use Tailwind font classes unless explicitly changing typography
- ✓ Verify font imports in globals.css

**Focus states not showing:**
- ✓ Add `focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2`
- ✓ For input wrappers, use `focus-within:` variant
- ✓ Check z-index if ring is hidden behind other elements

**Icons not rendering:**
- ✓ Import from correct package (`free-solid-svg-icons` vs `free-brands-svg-icons`)
- ✓ Use `<FontAwesomeIcon icon={faIconName} />` component
- ✓ Don't use Lucide icons

**State not persisting:**
- ✓ Check that state is defined at App level for cross-component features
- ✓ Verify state update functions are passed down correctly
- ✓ Use `useEffect` to sync state when needed

**Styling inconsistencies:**
- ✓ Always use CSS variables instead of hard-coded colors
- ✓ Check globals.css for available design tokens
- ✓ Follow existing component patterns for layout

---

## Contact & Support

For questions or clarifications about this prototype:
- Review this guidelines document first
- Check existing component implementations for patterns
- Refer to `/styles/globals.css` for design tokens
- Look at `/App.tsx` for state management examples

---

**Last Updated:** Sunday, October 19, 2025
**Version:** 1.0
**Status:** Ready for team remix and user testing
