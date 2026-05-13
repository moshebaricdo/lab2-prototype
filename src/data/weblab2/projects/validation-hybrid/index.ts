import type { FileItem } from "../../../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../../../types/validationReview";

const indexHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Pop-Up Workshop</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <main class="event-page">
      <section class="event-card">
        <p class="tag">Saturday Workshop</p>
        <h1>Build a Tiny Game</h1>
        <p id="summary">
          Join a beginner-friendly coding workshop and leave with a mini game
          you can share.
        </p>

        <button id="rsvpButton">RSVP</button>
        <p id="rsvpStatus">No RSVP yet</p>
      </section>
    </main>

    <script src="script.js"></script>
  </body>
</html>
`;

const styleCss = `body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: peachpuff;
  color: darkslategray;
}

.event-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
}

.event-card {
  max-width: 460px;
  border: 4px solid darkorange;
  border-radius: 24px;
  background: white;
  padding: 32px;
}

.tag {
  font-weight: bold;
  text-transform: uppercase;
}

#rsvpButton {
  border: 0;
  border-radius: 999px;
  background: darkorange;
  color: white;
  cursor: pointer;
  font-weight: bold;
  margin-top: 12px;
  padding: 10px 18px;
}
`;

const scriptJs = `const rsvpButton = document.querySelector("#rsvpButton");
const rsvpStatus = document.querySelector("#rsvpStatus");

// TODO: Make the RSVP button update the status text when clicked.
`;

export const validationHybridInstructionsMarkdown = `## Do This

Improve this workshop page so it feels more complete and has one working
interaction.

Required:

1. Make the RSVP button update the status text when clicked.
2. Improve the visual design so the page feels intentional.
3. Add at least one detail that makes the event more specific.
4. Use **Check my work** when you want a review of both the required behavior
   and the creative improvements.
`;

export const validationHybridReviewConfig: WebLab2ValidationReviewConfig = {
  mode: "hybrid",
  title: "Interaction and design review",
  goals: [
    "Required RSVP interaction works.",
    "Student refined the page design.",
    "Student added specific event details.",
  ],
  checks: [
    {
      id: "rsvp-click-handler",
      label: "RSVP button has click behavior",
      targetFile: "script.js",
      matcher: {
        type: "regex",
        value: "rsvpButton\\.addEventListener\\([\"']click[\"']",
      },
      passDetail: "The RSVP button is wired to a click listener.",
      failDetail: "Add a click event listener to the RSVP button.",
    },
    {
      id: "rsvp-status-update",
      label: "Click handler updates the page",
      targetFile: "script.js",
      matcher: {
        type: "regex",
        value: "rsvpStatus\\.(textContent|innerText)\\s*=",
      },
      passDetail: "The script updates the RSVP status text.",
      failDetail: "Inside the click handler, update the RSVP status text.",
    },
  ],
  minimumChangedFiles: 2,
};

export const validationHybridFileStructure: FileItem[] = [
  {
    name: "Workshop RSVP",
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
