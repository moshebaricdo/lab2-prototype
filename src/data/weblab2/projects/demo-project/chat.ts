import type { ChatMessage } from "../../../../types/chat";
import type { MockTutorConfig } from "../../../../types/tutor";

export const demoChatMessages: ChatMessage[] = [
  {
    role: "user",
    content:
      "I want my solar system app to have a sidebar on the left with the planet list, a big main area for the animation, and a panel at the bottom showing info about whichever planet is selected. Is there a way to do that layout with CSS?",
  },
  {
    role: "assistant",
    content:
      "Yes! CSS Grid is perfect for this. I set up a grid layout with named areas — a topbar spanning the full width, a fixed 200px sidebar, a flexible main viewport, and a 180px detail panel at the bottom right. I also added semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<aside>`) for each section.\n\nThe `1fr` value means \"take whatever space is left,\" so the viewport grows and shrinks with the window while the sidebar and detail panel stay fixed.",
    fileChanges: [
      { fileName: "style.css", status: "new", linesAdded: 14 },
      { fileName: "index.html", status: "modified", linesAdded: 8, linesRemoved: 2 },
    ],
  },
  {
    role: "assistant",
    content: "Aaliyah accepted this suggestion",
    isAlert: true,
    alertVariant: "accepted",
  },
  {
    role: "user",
    content:
      "That's exactly what I needed! Okay next question — I want the sun in the center of the viewport and I want it to look like it's actually glowing. Right now it's just a yellow circle.",
  },
  {
    role: "assistant",
    content:
      "I updated the `.sun` class with a `radial-gradient` that creates a hot white center fading to orange, and stacked four `box-shadow` layers that go from tight and bright to wide and dim — this simulates real light falloff and gives the sun a 3D glow effect.",
    fileChanges: [
      { fileName: "style.css", status: "modified", linesAdded: 9, linesRemoved: 3 },
    ],
  },
  {
    role: "assistant",
    content: "Aaliyah accepted this suggestion",
    isAlert: true,
    alertVariant: "accepted",
  },
  {
    role: "user",
    content:
      "OKAY that looks incredible. Now the big one — how do I make the planets actually orbit around the sun? Like, move in a circle path?",
  },
  {
    role: "assistant",
    content:
      "Instead of moving the planets directly, I added invisible orbit containers — each one is a circle centered on the sun that rotates using a `spin` keyframe animation. The planet sits on the edge and gets carried along.\n\nI also added `counter-spin` animations so the planets stay upright while orbiting. The counter-spin duration has to match the orbit duration exactly, otherwise you'll get a weird wobble.",
    fileChanges: [
      { fileName: "style.css", status: "modified", linesAdded: 38, linesRemoved: 1 },
      { fileName: "index.html", status: "modified", linesAdded: 24 },
      { fileName: "old-layout.css", status: "deleted" },
    ],
  },
  {
    role: "assistant",
    content: "Aaliyah dismissed this suggestion",
    isAlert: true,
    alertVariant: "rejected",
  },
  {
    role: "user",
    content:
      "I actually figured it out on my own!! But I'm stuck on one thing — can I add Saturn's rings with just CSS?",
  },
  {
    role: "assistant",
    content:
      "Nice work getting the orbits going yourself! For Saturn's ring I added a child `<span>` element and styled it as a wide, short ellipse tilted in 3D using `rotateX(65deg)`. The semi-transparent border gives it that classic ring look with visible gaps.\n\nYour app is looking really polished, Aaliyah. The grid layout with the orbiting planets is impressive — this goes well beyond what most students attempt.",
    fileChanges: [
      { fileName: "style.css", status: "modified", linesAdded: 11 },
      { fileName: "index.html", status: "modified", linesAdded: 1 },
    ],
  },
  {
    role: "assistant",
    content: "Aaliyah accepted this suggestion",
    isAlert: true,
    alertVariant: "accepted",
  },
  {
    role: "user",
    content:
      "This is so cool!! One more idea — could I make it so clicking a planet in the sidebar updates the detail panel to show that planet's info?",
  },
  {
    role: "assistant",
    content:
      "Love that idea! That would require JavaScript, which is outside what I can edit for you right now — but I can show you the pattern. You'd add a click listener to each sidebar button and use it to swap the content in the detail panel:\n\n```js\nconst buttons = document.querySelectorAll('.planet-btn');\nconst detail = document.querySelector('.detail');\n\nbuttons.forEach(btn => {\n  btn.addEventListener('click', () => {\n    const name = btn.dataset.planet;\n    detail.querySelector('.planet-name').textContent = name;\n    detail.querySelector('.planet-desc').textContent = planetData[name];\n  });\n});\n```\n\nYou'd store your planet facts in a JavaScript object like `planetData` and reference them by name. Try creating a `script.js` file and linking it at the bottom of your `index.html` with a `<script>` tag — I'm happy to help you debug once you give it a shot!",
  },
];

export const demoPrefilledInput =
  "Can you move the planet info from the bottom panel to a right-side sidebar? I want it to have a vertical layout instead of being squished at the bottom.";

export const demoPendingAiResponse: ChatMessage = {
  role: "assistant",
  content:
    "Great idea — a vertical sidebar will give each stat more breathing room and feel more like a real app. I restructured the CSS Grid from a 3-row layout to a 2-row, 3-column layout so the detail panel sits on the right instead of the bottom.\n\nThe sidebar now uses a `flex-direction: column` layout with more vertical spacing, and I bumped the width to 260px so the planet description isn't cramped. The stat grid switches from 4 columns to 2 so the numbers stack nicely in the narrower space.",
  fileChanges: [
    { fileName: "style.css", status: "modified", linesAdded: 18, linesRemoved: 12 },
    { fileName: "index.html", status: "modified", linesAdded: 3, linesRemoved: 3 },
  ],
  codeChangeStatus: "pending",
};

export const demoProjectMockTutor: MockTutorConfig = {
  initialMessages: demoChatMessages,
  initialInput: demoPrefilledInput,
  response: demoPendingAiResponse,
};
