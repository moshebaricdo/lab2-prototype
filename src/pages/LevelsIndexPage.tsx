import { Link } from "react-router-dom";
import { Tooltip } from "../components/ui/Tooltip";
import {
  bubbleChoiceLevelLinks,
  freeResponseLevelLinks,
  levelGroupLevelLinks,
  matchLevelLinks,
  multiChoiceLevelLinks,
  webLab2LevelLinks,
} from "./levelTypeLinks";

interface LevelPage {
  name: string;
  path: string;
}

interface LevelTypeEntry {
  levelType: string;
  description: string;
  pages: LevelPage[];
}

interface LevelCategory {
  title: string;
  entries: LevelTypeEntry[];
}

const LEVEL_CATEGORIES: LevelCategory[] = [
  {
    title: "Lab environments",
    entries: [
      {
        levelType: "Web Lab 2",
        description: "Current full-featured prototype environment.",
        pages: webLab2LevelLinks,
      },
    ],
  },
  {
    title: "Assessment",
    entries: [
      {
        levelType: "Multi-choice",
        description: "Thin vertical slice with local submit feedback.",
        pages: multiChoiceLevelLinks,
      },
      {
        levelType: "Free response",
        description: "Thin vertical slice with local text submission.",
        pages: freeResponseLevelLinks,
      },
      {
        levelType: "Match",
        description: "Thin vertical slice with drag-and-drop matching.",
        pages: matchLevelLinks,
      },
      {
        levelType: "Levelgroup",
        description: "Thin vertical slice combining multi, free response, and match.",
        pages: levelGroupLevelLinks,
      },
    ],
  },
  {
    title: "Misc",
    entries: [
      {
        levelType: "Bubble choice",
        description: "Choose one of four authored paths for the same concept.",
        pages: bubbleChoiceLevelLinks,
      },
    ],
  },
];

export function LevelsIndexPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-[#1f2a35]">
          Lab2 Level Types
        </h1>
        <p className="mt-2 text-[#5f6b7a]">
          Explore level types and jump directly into implemented page variants.
        </p>

        <div className="mt-8 space-y-8">
          {LEVEL_CATEGORIES.map((category) => (
            <section key={category.title}>
              <h2 className="text-xs uppercase tracking-wide text-[#5f6b7a]">
                {category.title}
              </h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {category.entries.map((entry) => (
                  <div
                    key={entry.levelType}
                    className="rounded-lg border border-[#d4dae1] bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-medium text-[#1f2a35]">
                          {entry.levelType}
                        </h3>
                        <p className="mt-2 text-sm text-[#5f6b7a]">
                          {entry.description}
                        </p>
                      </div>
                      <p className="text-xs uppercase tracking-wide text-[#7a8695]">
                        {entry.pages.length} page
                        {entry.pages.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {entry.pages.map((page, index) => (
                        <Tooltip
                          key={page.path}
                          content={page.name}
                          position="top"
                          sideOffset={8}
                        >
                          <Link
                            to={page.path}
                            aria-label={`Open ${page.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d4dae1] bg-white text-sm font-semibold text-[#1f2a35] transition-colors hover:border-[#3ea33e] hover:bg-[#3ea33e] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
                          >
                            {index + 1}
                          </Link>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
