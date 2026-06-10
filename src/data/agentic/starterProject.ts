import type { FileItem } from "../../types/file";

const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Maya's Portfolio</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="site-header">
      <h1>Maya Chen</h1>
      <p class="tagline">Student · Builder · Future Engineer</p>
    </header>

    <main>
      <section class="intro">
        <h2>About Me</h2>
        <p>
          I'm a student learning web development. This page collects the
          projects I've built so far this year.
        </p>
      </section>

      <section class="gallery">
        <h2>Project Gallery</h2>
        <div class="gallery-grid">
          <article class="project-card">
            <h3>Weather Widget</h3>
            <p>Shows the forecast for our school's zip code.</p>
          </article>
          <article class="project-card">
            <h3>Recipe Remix</h3>
            <p>Randomly mixes two recipes into one strange dinner.</p>
          </article>
          <article class="project-card">
            <h3>Study Timer</h3>
            <p>A pomodoro timer with a tomato that slowly disappears.</p>
          </article>
          <article class="project-card">
            <h3>Pixel Pet</h3>
            <p>A virtual pet that gets grumpy if you skip homework.</p>
          </article>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <p>Built in Web Lab 2</p>
      <p class="social-links">
        <a href="https://github.com">🐙</a>
        <a href="https://photos.example.com">📷</a>
      </p>
    </footer>
    <script src="script.js"></script>
  </body>
</html>
`;

const stylesCss = `/* Maya's Portfolio styles */

body {
  margin: 0;
  font-family: "Segoe UI", system-ui, sans-serif;
  color: #2d2a4a;
  background: #faf9ff;
}

.site-header {
  padding: 48px 24px 32px;
  text-align: center;
  background: linear-gradient(135deg, #6c4ccf, #8e6ff0);
  color: white;
}

.site-header h1 {
  margin: 0 0 4px;
  font-size: 2.2rem;
}

.tagline {
  margin: 0;
  opacity: 0.85;
}

main {
  max-width: 760px;
  margin: 0 auto;
  padding: 24px;
}

/* TODO: the project gallery needs styling — right now the cards
   just stack in a plain column with no visual treatment. */

.site-footer {
  padding: 24px;
  text-align: center;
  color: #8b87a8;
  font-size: 0.9rem;
}
`;

const scriptJs = `// Maya's Portfolio scripts
console.log("Portfolio loaded");

// Greet visitors based on the time of day.
const hour = new Date().getHours();
const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
console.log(greeting + ", welcome to my portfolio!");
`;

/**
 * The spec the spec-writer agent produces in the crew demo, and which already
 * exists in the project for the mission demo (continuity across the two levels).
 */
export const gallerySpecMarkdown = `# Project Gallery Spec

## Goal
Turn the plain list of project cards into a polished, scannable gallery.

## Requirements
1. Cards display in a 2-column grid on desktop and a single column under 640px.
2. Every card has the same treatment: white background, rounded corners, soft shadow.
3. Cards lift slightly on hover so they feel clickable.
4. Card headings use the site's purple accent color.
5. Spacing between cards is consistent (16–24px gaps).

## Out of scope
- No JavaScript changes.
- No new pages or navigation.
`;

/** styles.css after the Designer's proposed change is applied. */
export const styledGalleryCss = `${stylesCss}
/* Project gallery — implements Specs/SPEC.md */

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 16px;
}

.project-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(45, 42, 74, 0.08);
  padding: 20px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.project-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(45, 42, 74, 0.14);
}

.project-card h3 {
  margin-top: 0;
  color: #6c4ccf;
}

@media (max-width: 640px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
`;

/**
 * index.html after the accessibility checker's proposed fix: the emoji-only
 * footer links gain accessible names.
 */
export const accessibleIndexHtml = indexHtml
  .replace(
    '<a href="https://github.com">🐙</a>',
    '<a href="https://github.com" aria-label="GitHub profile">🐙</a>',
  )
  .replace(
    '<a href="https://photos.example.com">📷</a>',
    '<a href="https://photos.example.com" aria-label="Photo gallery">📷</a>',
  );

export const PROJECT_ROOT_NAME = "My Portfolio";

export function buildAgenticStarterTree(options?: {
  includeSpec?: boolean;
  styled?: boolean;
}): FileItem[] {
  const children: FileItem[] = [
    { name: "index.html", type: "html", content: indexHtml },
    {
      name: "styles.css",
      type: "css",
      content: options?.styled ? styledGalleryCss : stylesCss,
    },
    { name: "script.js", type: "file", content: scriptJs },
  ];
  if (options?.includeSpec) {
    children.push({
      name: "Specs",
      type: "folder",
      children: [
        { name: "SPEC.md", type: "text", content: gallerySpecMarkdown },
      ],
    });
  }
  return [
    {
      name: PROJECT_ROOT_NAME,
      type: "folder",
      children,
    },
  ];
}
