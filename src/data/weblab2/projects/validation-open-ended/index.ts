import type { FileItem } from "../../../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../../../types/validationReview";

const indexHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Community Spotlight</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <p class="eyebrow">Starter page</p>
        <h1>Community Spotlight</h1>
        <p>
          Turn this into a small page about a place, event, club, cause, or
          personal interest you care about.
        </p>
      </section>

      <section class="content-card">
        <h2>What to add</h2>
        <ul>
          <li>A clear topic and audience</li>
          <li>At least two sections of real content</li>
          <li>Style choices that match the topic</li>
        </ul>
      </section>

      <script src="script.js"></script>
    </main>
  </body>
</html>
`;

const styleCss = `body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, lavender, honeydew);
  color: midnightblue;
}

.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 20px;
}

.hero,
.content-card {
  background: white;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(25, 25, 60, 0.12);
  margin-bottom: 20px;
  padding: 28px;
}

.eyebrow {
  font-weight: bold;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
`;

const scriptJs = `console.log("Ready to customize your community spotlight page.");
`;

export const validationOpenEndedInstructionsMarkdown = `## Do This

Create a small web page about a topic you choose: a local event, club, hobby,
cause, product idea, or personal interest.

Your goal is not to match one exact answer. Instead, show meaningful progress:

1. Pick a clear topic and audience.
2. Add real page content, not just placeholder text.
3. Make visual choices that fit your topic.
4. Ask AI Tutor for help or feedback when you want another perspective.
5. Use **Check my work** when you want Tutor to review the effort and next steps.
`;

export const validationOpenEndedReviewConfig: WebLab2ValidationReviewConfig = {
  mode: "open-ended",
  title: "Open-ended project review",
  goals: [
    "Student chose a topic and audience.",
    "Student added visible page content.",
    "Student made intentional style choices.",
  ],
  checks: [
    {
      id: "has-heading",
      label: "Page has a clear heading",
      targetFile: "index.html",
      matcher: {
        type: "regex",
        value: "<h1>[^<]{12,}</h1>",
        flags: "i",
      },
      passDetail: "The page has a specific top-level heading.",
      failDetail: "Update the main heading so it clearly names the page topic.",
    },
    {
      id: "has-second-section",
      label: "Page has multiple content sections",
      targetFile: "index.html",
      matcher: {
        type: "regex",
        value: "<section[\\s\\S]*<section",
        flags: "i",
      },
      passDetail: "The page has more than one content section.",
      failDetail: "Add another section with real content about the topic.",
    },
  ],
  minimumChangedFiles: 2,
};

export const validationOpenEndedFileStructure: FileItem[] = [
  {
    name: "Community Spotlight",
    type: "folder",
    children: [
      {
        name: "index.html",
        type: "html",
        content: indexHtml,
      },
      {
        name: "style.css",
        type: "css",
        content: styleCss,
      },
      {
        name: "script.js",
        type: "file",
        content: scriptJs,
      },
    ],
  },
];
