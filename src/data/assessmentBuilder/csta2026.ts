import type {
  DomainTag,
  StandardCategory,
  StandardFramework,
} from "../../types/assessmentBuilder";

/**
 * CSTA K-12 Computer Science Standards (2026), in prod's shape: framework →
 * concept → subconcept → standard. A standard points at its subconcept; the
 * subconcept's parent is the concept. Shortcodes are
 * `{gradeBand}-{concept}-{subconcept}-{number}`, and the number runs across
 * the grade band in outline order, so it doubles as `position`.
 */
export const CSTA_2026: StandardFramework = {
  id: "csta2026",
  shortLabel: "CSTA 2026",
  label: "CSTA K-12 Computer Science Standards (2026)",
};

export const CSTA_CONCEPTS: Record<string, StandardCategory> = {
  ALG: { id: "csta-alg", code: "ALG", label: "Algorithms and Design", position: 1 },
  PRO: { id: "csta-pro", code: "PRO", label: "Programming", position: 2 },
  DAT: { id: "csta-dat", code: "DAT", label: "Data and Analysis", position: 3 },
  SYS: { id: "csta-sys", code: "SYS", label: "Systems and Security", position: 4 },
  SOC: { id: "csta-soc", code: "SOC", label: "Computing and Society", position: 5 },
};

const SUBCONCEPT_LABELS: Record<string, string> = {
  "ALG-PS": "Algorithmic Problem Solving",
  "ALG-ML": "Machine Learning",
  "ALG-IM": "Impacts of Algorithms and Design",
  "PRO-PD": "Program Development",
  "PRO-VD": "Variables and Data Storage",
  "PRO-RD": "Reading and Documenting",
  "PRO-TR": "Testing and Refining",
  "DAT-DC": "Data Collection and Preparation",
  "DAT-DI": "Data Investigation",
  "DAT-IM": "Impacts of Data Science",
  "SYS-HW": "Hardware and Software",
  "SYS-SE": "Security",
  "SYS-NT": "Networks",
  "SYS-IM": "Impacts of Computing Systems",
  "SOC-HI": "History of Computing",
  "SOC-ET": "Emerging Technologies",
  "SOC-HU": "Humans and Computing",
  "SOC-CE": "Career Exploration",
};

/**
 * Subconcept keyed by concept + subconcept, so the three `IM` subconcepts
 * stay apart. (Prod's seeder currently merges them into one `IM` row under
 * SYS; this models the intended tree, not that bug.)
 */
export function cstaSubconcept(concept: string, sub: string): StandardCategory {
  const key = `${concept}-${sub}`;
  return {
    id: `csta-${key.toLowerCase()}`,
    code: sub,
    label: SUBCONCEPT_LABELS[key],
    parent: CSTA_CONCEPTS[concept],
  };
}

/** `MS-PRO-TR-19` + its statement → a tag. Prod's name is the full statement. */
export function cstaTag(code: string, statement: string): DomainTag {
  const [, concept, sub, num] = code.split("-");
  return {
    id: `csta2026-${code.toLowerCase()}`,
    code,
    label: statement,
    description: statement,
    framework: CSTA_2026,
    category: cstaSubconcept(concept, sub),
    position: Number(num),
  };
}
