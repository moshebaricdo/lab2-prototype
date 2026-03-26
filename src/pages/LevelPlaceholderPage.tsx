import { Link } from "react-router-dom";

interface LevelPlaceholderPageProps {
  levelTypeName: string;
  description: string;
}

export function LevelPlaceholderPage({
  levelTypeName,
  description,
}: LevelPlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-[#f7f8fb] p-8">
      <div className="mx-auto max-w-3xl rounded-lg border border-[#d4dae1] bg-white p-8">
        <p className="text-xs uppercase tracking-wide text-[#5f6b7a]">
          Coming soon
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1f2a35]">
          {levelTypeName}
        </h1>
        <p className="mt-4 text-[#5f6b7a]">{description}</p>
        <Link
          to="/levels"
          className="mt-8 inline-block text-sm font-medium text-[#0093a4]"
        >
          Back to /levels
        </Link>
      </div>
    </main>
  );
}
