import type { FaIconName } from "../../icons/faProRegularCodepoints";

export type ClassSectionIconTone =
  | "teal"
  | "orange"
  | "green"
  | "yellow";

export interface ClassSection {
  id: string;
  period: string;
  title: string;
  term: string;
  classCode: string;
  courseName: string;
  iconName: FaIconName;
  iconTone: ClassSectionIconTone;
}

export const TEACHER_NAME = "Ms. Smith";

export const NAV_LINKS: Array<{ label: string; href: string }> = [
  { label: "Dashboard", href: "#" },
  { label: "Course Catalog", href: "#" },
  { label: "Projects", href: "#" },
  { label: "Professional Learning", href: "#" },
  { label: "Incubator", href: "#" },
];

export const CLASS_SECTIONS: ClassSection[] = [
  {
    id: "period-1",
    period: "Period 1",
    title: "Coding With AI",
    term: "Fall 2024",
    classCode: "PJNHYF",
    courseName: "Coding with AI",
    iconName: "umbrella",
    iconTone: "teal",
  },
  {
    id: "period-3",
    period: "Period 3",
    title: "Physical Computing",
    term: "Fall 2024",
    classCode: "YTQBVF",
    courseName: "Creating Apps with Devices (micro:bit)",
    iconName: "football",
    iconTone: "orange",
  },
  {
    id: "period-4",
    period: "Period 4",
    title: "Game Design",
    term: "Fall 2024",
    classCode: "HRVBSQ",
    courseName: "CSD Unit 3: Interactive Animations and Games",
    iconName: "pizza",
    iconTone: "green",
  },
  {
    id: "period-7",
    period: "Period 7",
    title: "AP CSA",
    term: "2024-2025",
    classCode: "PNVDTW",
    courseName: "Computer Science A",
    iconName: "cupcake",
    iconTone: "yellow",
  },
];

export const LESSON_OPTIONS = [
  { value: "", label: "Go to a lesson" },
  { value: "lesson-1", label: "Lesson 1: Introduction" },
  { value: "lesson-2", label: "Lesson 2: Variables" },
];
