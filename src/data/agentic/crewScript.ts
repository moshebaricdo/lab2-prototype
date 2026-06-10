import type { FileChange } from "../../types/chat";
import {
  accessibleIndexHtml,
  gallerySpecMarkdown,
  styledGalleryCss,
} from "./starterProject";

/**
 * Scripted conversation model for the specialist-agents level — the no-API-key
 * fallback. With a key configured, live runs go through
 * src/lib/tutor/agents/specialistRun.ts instead and this file is unused.
 *
 * Replies render through the real AiTutorPanel: proposals stage real
 * proposedContent on the file tree (beginAiProposal) and use the panel's
 * standard accept/reject card. Every agent output is a reviewable proposal —
 * including the spec.
 *
 * Copy rules (curricular guidelines): agents are tools, not characters — no
 * human names, no personas, refer to an agent as "it".
 */

/** Keys driving post-accept follow-ups (unlocks, hand-off nudges). */
export type CrewProposalKey = "gallery-spec" | "gallery-css" | "a11y-html";

export interface CrewStagedChange {
  fileName: string;
  status: "new" | "modified";
  content: string;
}

export interface CrewProposal {
  key: CrewProposalKey;
  saveTitle: string;
  /** Card summary (names + line counts). */
  fileChanges: FileChange[];
  /** Real contents staged on the tree while the proposal is pending. */
  changes: CrewStagedChange[];
}

export interface CrewScriptedReply {
  text: string;
  proposal?: CrewProposal;
  /** Renders an in-chat hand-off card to another agent. */
  handOffTo?: { agentId: string; reason: string };
}

export interface CrewKeywordRule {
  id: string;
  /** Lowercase substrings; any hit matches. Rules are checked in order. */
  keywords: string[];
  reply: CrewScriptedReply;
  /** Only match while Specs/SPEC.md exists / doesn't exist. */
  requiresSpec?: boolean;
  requiresNoSpec?: boolean;
  /** Fire at most once per session (e.g. proposals). */
  once?: boolean;
}

export interface CrewSpecialistScript {
  specialistId: string;
  /** First message when the agent first becomes active (spec not yet written). */
  opening: string;
  /** Variant used when Specs/SPEC.md already exists. */
  openingWithSpec?: string;
  rules: CrewKeywordRule[];
  fallback: string;
  fallbackWithSpec?: string;
}

export const crewScripts: CrewSpecialistScript[] = [
  {
    specialistId: "tutor",
    opening:
      'This level adds **specialist agents** to Web Lab 2. Instead of one assistant that does everything, each agent runs with a smaller job and a smaller slice of your project in its **context window** — switch agents in the bar below, and check the ⓘ for what the active one can see.\n\nYour project gallery currently renders as a plain stacked column. Try asking **"what\'s wrong with my gallery?"** — or **"why specialists?"** first.',
    rules: [
      {
        id: "why-specialists",
        keywords: ["why", "specialist", "context window", "what are agents", "how do agents"],
        reply: {
          text:
            "AI agents have a limited **context window** — only so much fits in front of the model at once. Pack everything in and the answers get slower, vaguer, and more expensive. Give an agent exactly what its job needs and it does that job well.\n\nThat's why the **Spec writer** can't see your code at all: a spec should describe what you want, not copy what's already there.",
          handOffTo: {
            agentId: "spec-writer",
            reason: "Ask it for a written plan — it interviews you, not your code.",
          },
        },
      },
      {
        id: "diagnose",
        keywords: ["wrong", "gallery", "broken", "stack", "column", "plain", "boring", "look"],
        reply: {
          text:
            "Open `styles.css` — there's a TODO where the gallery styles should be. Your HTML defines `.gallery-grid` and `.project-card`, but no CSS targets them yet, so the cards stack in a single plain column.\n\nBefore any CSS gets written, it's worth pinning down **what you want**.",
          handOffTo: {
            agentId: "spec-writer",
            reason: "Writing that down is its whole job.",
          },
        },
      },
      {
        id: "edit-decline",
        keywords: ["edit", "fix", "css", "style", "change", "make it", "write the"],
        reply: {
          text:
            "File edits aren't in this agent's toolkit — the Tutor explains and routes. CSS changes are the **Style agent**'s job, and it works best from a written spec.",
          handOffTo: {
            agentId: "spec-writer",
            reason: "Start with the spec so the Style agent has something to build from.",
          },
        },
      },
    ],
    fallback:
      "The Tutor's job here is to explain and to point you to the right agent. For this level the path is: **Spec writer** drafts `Specs/SPEC.md`, then the **Style agent** implements it in CSS. Pick an agent in the bar below, or ask what's wrong with the gallery.",
  },
  {
    specialistId: "spec-writer",
    opening:
      'Spec writer active. Note what\'s **not** in its context: your code. A spec describes the goal — it shouldn\'t be biased by whatever the code does today.\n\nThe level goal is a polished project gallery. Say **"write the spec"** for a first draft, or describe what you want the gallery to look like.',
    openingWithSpec:
      "Spec writer active. `Specs/SPEC.md` is already drafted — five testable requirements covering the grid, card treatment, hover, headings, and spacing. Describe a change to revise it, or hand off to the **Style agent** to implement it.",
    rules: [
      {
        id: "write-spec",
        keywords: ["write", "spec", "plan", "draft", "yes", "go", "polish", "grid", "card", "nice", "modern"],
        requiresNoSpec: true,
        once: true,
        reply: {
          text:
            "Draft ready — review `Specs/SPEC.md` below. Five testable requirements: a 2-column grid that collapses on small screens, consistent card treatment, a hover lift, purple headings, and even spacing. JavaScript is explicitly out of scope.\n\nNothing lands in your project until you accept — **a spec is a proposal too.**",
          proposal: {
            key: "gallery-spec",
            saveTitle: "Project gallery spec",
            fileChanges: [
              { fileName: "Specs/SPEC.md", status: "new", linesAdded: 16 },
            ],
            changes: [
              {
                fileName: "Specs/SPEC.md",
                status: "new",
                content: gallerySpecMarkdown,
              },
            ],
          },
        },
      },
      {
        id: "no-code-access",
        keywords: ["css", "html", "code", "script", "look at", "styles."],
        reply: {
          text:
            "Project files aren't in this agent's context — by design. If the spec needs to change, describe the *goal* differently. For questions about the code itself, the **Tutor** has the whole project in context.",
          handOffTo: {
            agentId: "tutor",
            reason: "It can see every file in the project.",
          },
        },
      },
      {
        id: "revise",
        keywords: ["revise", "change", "update", "add", "instead"],
        requiresSpec: true,
        reply: {
          text:
            "This is where requirements get renegotiated — in the real flow the spec would be revised and every agent downstream would pick up the change. (In this demo the draft is fixed.)",
          handOffTo: {
            agentId: "designer",
            reason: "It builds from Specs/SPEC.md, not from this chat.",
          },
        },
      },
    ],
    fallback:
      'Anything you describe here becomes requirements in `Specs/SPEC.md` — that file is what the other agents build against. Say **"write the spec"** when you\'re ready.',
    fallbackWithSpec:
      "The spec is drafted. Next hand-off: the **Style agent** — it reads `Specs/SPEC.md`, not this conversation.",
  },
  {
    specialistId: "designer",
    opening:
      "Style agent active. Its context holds `index.html` and `styles.css` — and it expects `Specs/SPEC.md`, which doesn't exist yet. Without a spec this agent would just guess at what you want.",
    openingWithSpec:
      'Style agent active — fresh context. It just read `Specs/SPEC.md` (five requirements) plus `index.html` and `styles.css`. Nothing from your other conversations came along.\n\nSay **"implement the spec"** to get a proposed change to `styles.css`.',
    rules: [
      {
        id: "behavior-decline",
        keywords: ["javascript", "script", "click", "animate", "button", "behavior", "interactive"],
        reply: {
          text:
            "`script.js` isn't in this agent's context — behavior is outside its job, and the spec lists JavaScript as out of scope. Keeping that file out of context is what keeps this agent focused on styling.",
          handOffTo: {
            agentId: "tutor",
            reason: "It can explain how behavior would work.",
          },
        },
      },
      {
        id: "implement-spec",
        keywords: ["implement", "build", "apply", "go", "yes", "do it", "style", "css", "make", "spec"],
        requiresSpec: true,
        once: true,
        reply: {
          text:
            "Proposal ready, built from `Specs/SPEC.md`: a responsive 2-column grid (single column under 640px), white cards with rounded corners and a soft shadow, a hover lift, and purple card headings.\n\nThe preview already shows the proposed result — accept to keep it, reject to roll back. **Agent output is a draft, not a decision.**",
          proposal: {
            key: "gallery-css",
            saveTitle: "Gallery styles from spec",
            fileChanges: [
              { fileName: "styles.css", status: "modified", linesAdded: 33, linesRemoved: 1 },
            ],
            changes: [
              {
                fileName: "styles.css",
                status: "modified",
                content: styledGalleryCss,
              },
            ],
          },
        },
      },
      {
        id: "implement-without-spec",
        keywords: ["implement", "build", "apply", "go", "style", "css", "make"],
        requiresNoSpec: true,
        reply: {
          text:
            "There's no `Specs/SPEC.md` in this agent's context yet, so any CSS it wrote would be a guess.",
          handOffTo: {
            agentId: "spec-writer",
            reason: "Get a draft first — that hand-off is the whole point of this level.",
          },
        },
      },
    ],
    fallback:
      "This agent proposes CSS changes built from the spec. If you want something the spec doesn't cover, have the **Spec writer** revise `Specs/SPEC.md` first — this agent picks up whatever that file says.",
    fallbackWithSpec:
      'This agent proposes CSS changes built from the spec. Say **"implement the spec"**, or have the **Spec writer** revise `Specs/SPEC.md` if the requirements changed.',
  },
  {
    specialistId: "a11y",
    opening:
      'Accessibility checker active. Its context is deliberately tiny: `index.html` and the spec — structure and semantics only, no styles, no scripts.\n\nOne issue found: the two footer links (🐙 and 📷) have no accessible name, so a screen reader announces each one as just "link". Say **"fix it"** to see a proposed fix.',
    rules: [
      {
        id: "fix-links",
        keywords: ["fix", "yes", "propose", "go", "label", "alt", "aria", "links"],
        once: true,
        reply: {
          text:
            'Proposal ready: an `aria-label` for each footer link ("GitHub profile", "Photo gallery"). Visually nothing changes — but a screen reader now announces something meaningful.\n\nSmall context, small change, easy to verify. That\'s the shape of a good specialist task.',
          proposal: {
            key: "a11y-html",
            saveTitle: "Accessible footer links",
            fileChanges: [
              { fileName: "index.html", status: "modified", linesAdded: 2, linesRemoved: 2 },
            ],
            changes: [
              {
                fileName: "index.html",
                status: "modified",
                content: accessibleIndexHtml,
              },
            ],
          },
        },
      },
      {
        id: "contrast-decline",
        keywords: ["css", "style", "color", "contrast", "font"],
        reply: {
          text:
            "Color and contrast live in `styles.css`, which isn't in this agent's context. It audits what HTML alone can prove: accessible names, landmarks, heading order, alt text.",
        },
      },
    ],
    fallback:
      'This agent reviews `index.html` for semantics and accessible names. Say **"fix it"** to see the proposed footer-link fix.',
  },
];

/**
 * Posted as an info alert when the student switches agents — the visible
 * transcript stays (that's the student's history), but the agent's context
 * starts fresh. Making that difference explicit is the core lesson.
 */
export function buildSwitchNote(role: string, seesSummary: string): string {
  return `Now chatting with: ${role}. Fresh context — it sees ${seesSummary}, not this conversation.`;
}

/** Posted as an info alert when a locked agent becomes available. */
export const a11yUnlockNote =
  "New agent available: Accessibility checker. It reviews index.html with a deliberately small context — select it in the agent bar.";

/** Follow-ups posted after a proposal is accepted, keyed by proposal. */
export const crewAcceptFollowUps: Record<
  CrewProposalKey,
  { text: string; handOffTo?: { agentId: string; reason: string } }
> = {
  "gallery-spec": {
    text:
      "`Specs/SPEC.md` is in your project. That file is how agents hand work to each other — the **Style agent** won't read this conversation, it reads the spec.",
    handOffTo: {
      agentId: "designer",
      reason: "It starts fresh: just the spec, index.html, and styles.css.",
    },
  },
  "gallery-css": {
    text:
      "Open the **Preview** to see the grid. Notice what just happened: the Spec writer never saw your code, the Style agent never saw your chat with the Spec writer — `Specs/SPEC.md` carried everything between them. That's how agent teams coordinate.",
  },
  "a11y-html": {
    text:
      "Both proposals shipped. You briefed agents, inspected their context windows, reviewed their drafts, and decided what landed — that's the whole agentic loop, and you ran it.",
  },
};
