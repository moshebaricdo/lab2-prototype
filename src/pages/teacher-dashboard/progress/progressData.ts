import type { FaIconName } from "../../../icons/faProRegularCodepoints";

/** Completion / teacher-action status that can render inside a progress cell. */
export type ProgressStatus =
  | "in-progress"
  | "validated"
  | "submitted"
  | "no-work"
  | "needs-feedback"
  | "feedback-given"
  | "keep-working";

export interface ProgressNavItem {
  id: string;
  label: string;
  iconName: FaIconName;
}

export interface ProgressNavSection {
  id: string;
  label: string;
  items: ProgressNavItem[];
}

/** The page the recreation is anchored on; the only interactive nav target. */
export const ACTIVE_NAV_ID = "progress";

export const NAV_SECTIONS: ProgressNavSection[] = [
  {
    id: "course-content",
    label: "Course content",
    items: [
      { id: "course", label: "Course", iconName: "desktop" },
      { id: "lesson-materials", label: "Lesson Materials", iconName: "folder" },
      { id: "calendar", label: "Calendar", iconName: "calendar" },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    items: [
      { id: "progress", label: "Progress", iconName: "chart-line" },
      { id: "assessments", label: "Assessments", iconName: "star" },
      { id: "student-projects", label: "Student Projects", iconName: "code" },
      { id: "stats", label: "Stats", iconName: "chart-simple" },
      { id: "text-responses", label: "Text Responses", iconName: "pencil" },
      { id: "student-snapshot", label: "Student Snapshot", iconName: "table-cells" },
    ],
  },
  {
    id: "classroom",
    label: "Classroom",
    items: [
      { id: "roster", label: "Roster", iconName: "users" },
      { id: "settings", label: "Settings", iconName: "gear" },
      { id: "ai-settings", label: "AI Settings", iconName: "robot" },
    ],
  },
];

export const CLASS_SECTION_OPTIONS = [
  { value: "aif-test", label: "AIF Test" },
  { value: "period-1", label: "Period 1: Coding With AI" },
  { value: "period-3", label: "Period 3: Physical Computing" },
];

export const SORT_OPTIONS = [
  { value: "family-name", label: "Family name" },
  { value: "given-name", label: "Given name" },
  { value: "progress", label: "Progress" },
];

export const UNIT_OPTIONS = [
  { value: "ai-generated-design", label: "AI-Generated Design *" },
  { value: "intro-to-ai", label: "Intro to AI" },
  { value: "data-and-society", label: "Data and Society" },
];

export interface ProgressSublevel {
  id: string;
  label: string;
  /** Decorates the sublevel header with an assessment star or choice glyph. */
  levelType?: "assessment" | "choice";
}

export interface ProgressLesson {
  id: string;
  number: number;
  title: string;
  expanded: boolean;
  sublevels: ProgressSublevel[];
}

export const LESSONS: ProgressLesson[] = [
  { id: "lesson-1", number: 1, title: "Lesson 1", expanded: false, sublevels: [] },
  {
    id: "lesson-2",
    number: 2,
    title: "Lesson 2: The User's Experience",
    expanded: true,
    sublevels: [
      { id: "2.1", label: "2.1" },
      { id: "2.2", label: "2.2" },
      { id: "2.3", label: "2.3" },
      { id: "2.4", label: "2.4" },
      { id: "2.5", label: "2.5" },
      { id: "2.6", label: "2.6" },
      { id: "2.7", label: "2.7", levelType: "assessment" },
      { id: "2.8", label: "2.8" },
    ],
  },
  ...Array.from({ length: 11 }, (_, index) => {
    const number = index + 3;
    return {
      id: `lesson-${number}`,
      number,
      title: `Lesson ${number}`,
      expanded: false,
      sublevels: [],
    } satisfies ProgressLesson;
  }),
];

export interface ProgressStudentRow {
  id: string;
  name: string;
  timeSpentMinutes: number;
  lastUpdated: string;
  /** Aggregate status shown in each collapsed lesson column, keyed by lesson id. */
  lessonStatus: Record<string, ProgressStatus | undefined>;
}

export const STUDENTS: ProgressStudentRow[] = [
  {
    id: "aif-student",
    name: "AIF Student",
    timeSpentMinutes: 1,
    lastUpdated: "4/3",
    lessonStatus: {
      "lesson-1": "in-progress",
    },
  },
];

export const ACTIVE_UNIT_LABEL = "AIF TEST";
