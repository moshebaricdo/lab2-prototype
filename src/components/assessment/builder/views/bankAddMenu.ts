import type { AssessmentSection } from "../../../../types/assessmentBuilder";
import { sectionDisplayTitle } from "../../../../lib/assessmentBuilder";

export const BANK_ADD_NEW_SECTION = "new" as const;

export type BankAddSectionId = string | typeof BANK_ADD_NEW_SECTION;

/** Figma B1.6 — extraSmall action menu when the quiz has multiple sections. */
export function bankSectionMenuOptions(sections: AssessmentSection[]) {
  return [
    ...sections.map((section, index) => ({
      value: section.id,
      label: sectionDisplayTitle(section, index),
    })),
    { type: "separator" as const },
    {
      value: BANK_ADD_NEW_SECTION,
      label: "New section",
      iconName: "plus" as const,
    },
  ];
}
