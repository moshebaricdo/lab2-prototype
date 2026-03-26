import { Link } from "react-router-dom";

interface LevelEntry {
  name: string;
  path: string;
  description: string;
}

interface LevelCategory {
  title: string;
  entries: LevelEntry[];
}

const LEVEL_CATEGORIES: LevelCategory[] = [
  {
    title: "Lab environments",
    entries: [
      {
        name: "Web Lab 2",
        path: "/levels/weblab2",
        description: "Current full-featured prototype environment.",
      },
    ],
  },
  {
    title: "Assessment",
    entries: [
      {
        name: "Multi-choice",
        path: "/levels/multi",
        description: "Thin vertical slice with local submit feedback.",
      },
      {
        name: "Free response",
        path: "/levels/free-response",
        description: "Thin vertical slice with local text submission.",
      },
      {
        name: "Match",
        path: "/levels/match",
        description: "Thin vertical slice with drag-and-drop matching.",
      },
      {
        name: "Levelgroup",
        path: "/levels/levelgroup",
        description: "Thin vertical slice combining multi, free response, and match.",
      },
    ],
  },
  {
    title: "Misc",
    entries: [
      {
        name: "Bubble choice",
        path: "/levels/bubble-choice",
        description: "Choose one of four authored paths for the same concept.",
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
          Explore implemented level experiences and placeholders for upcoming
          assessment migrations.
        </p>

        <div className="mt-8 space-y-8">
          {LEVEL_CATEGORIES.map((category) => (
            <section key={category.title}>
              <h2 className="text-xs uppercase tracking-wide text-[#5f6b7a]">
                {category.title}
              </h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {category.entries.map((entry) => (
                  <Link
                    key={entry.path}
                    to={entry.path}
                    className="rounded-lg border border-[#d4dae1] bg-white p-5 transition-colors hover:border-[#0093a4]"
                  >
                    <h3 className="text-lg font-medium text-[#1f2a35]">
                      {entry.name}
                    </h3>
                    <p className="mt-2 text-sm text-[#5f6b7a]">
                      {entry.description}
                    </p>
                    <p className="mt-4 text-sm text-[#0093a4]">
                      Open {entry.path}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
