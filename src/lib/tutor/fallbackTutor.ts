import type { FileItem } from "../../types/file";
import type { TutorEditResult } from "./types";

function flattenFileItems(files: FileItem[]): FileItem[] {
  return files.flatMap((item) =>
    item.children ? flattenFileItems(item.children) : [item],
  );
}

function findFile(files: FileItem[], fileName: string) {
  return flattenFileItems(files).find((file) => file.name === fileName);
}

function countFallbackChangedLines(before = "", after = "") {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const max = Math.max(beforeLines.length, afterLines.length);
  let changed = 0;

  for (let index = 0; index < max; index += 1) {
    if (beforeLines[index] !== afterLines[index]) {
      changed += 1;
    }
  }

  return {
    linesAdded: Math.max(1, Math.ceil(changed * 0.6)),
    linesRemoved: Math.max(0, Math.floor(changed * 0.35)),
  };
}

function isLayoutRequest(message: string) {
  return /(sidebar|side\s*bar|right[-\s]?side|detail panel|details panel|planet info|layout|vertical)/i.test(message);
}

function isInteractiveRequest(message: string) {
  return /(click|clickable|tap|select|selected|interactive|javascript|\bjs\b|event listener|dynamic|update\s+(the\s+)?(detail|info|panel)|change\s+(the\s+)?(detail|info|panel))/i.test(message);
}

function isPlanetClickRequest(message: string) {
  return isInteractiveRequest(message) && /(planet|mercury|venus|earth|mars|jupiter|saturn|uranus|neptune)/i.test(message);
}

function withScriptReference(indexContent: string) {
  if (/script\s+src=["']script\.js["']/i.test(indexContent)) {
    return indexContent;
  }
  if (indexContent.includes("</body>")) {
    return indexContent.replace("</body>", "  <script src=\"script.js\"></script>\n</body>");
  }
  return `${indexContent}\n<script src="script.js"></script>\n`;
}

function buildPlanetClickScript() {
  return `const planetDetails = {
  Mercury: {
    type: "Terrestrial Planet",
    color: "#b5b5b5",
    glow: "rgba(181,181,181,0.5)",
    stats: ["4,879 km", "0", "88 d", "167 °C"],
    description: "The smallest planet in our solar system and the closest to the Sun. Mercury has extreme temperature swings because it has almost no atmosphere.",
    tags: ["Smallest Planet", "Fast Orbit", "Cratered", "No Moons"],
  },
  Venus: {
    type: "Terrestrial Planet",
    color: "#e8cda0",
    glow: "rgba(232,205,160,0.5)",
    stats: ["12,104 km", "0", "225 d", "464 °C"],
    description: "Venus is wrapped in thick clouds that trap heat, making it the hottest planet even though Mercury is closer to the Sun.",
    tags: ["Thick Atmosphere", "Hottest Planet", "Cloudy", "Rocky"],
  },
  Earth: {
    type: "Terrestrial Planet",
    color: "#4da6ff",
    glow: "rgba(77,166,255,0.5)",
    stats: ["12,756 km", "1", "365.25 d", "15 °C"],
    description: "The only planet known to support life. Earth's atmosphere and magnetic field protect us from solar radiation. 71% of the surface is covered by water.",
    tags: ["Habitable Zone", "Atmosphere", "Water", "Magnetic Field"],
  },
  Mars: {
    type: "Terrestrial Planet",
    color: "#e85d3a",
    glow: "rgba(232,93,58,0.5)",
    stats: ["6,779 km", "2", "687 d", "-65 °C"],
    description: "Mars is known as the Red Planet because iron minerals in its soil give it a rusty color. It has giant volcanoes and signs of ancient water.",
    tags: ["Red Planet", "Two Moons", "Olympus Mons", "Thin Atmosphere"],
  },
  Jupiter: {
    type: "Gas Giant",
    color: "#c4956a",
    glow: "rgba(196,149,106,0.5)",
    stats: ["139,820 km", "95", "11.9 y", "-110 °C"],
    description: "Jupiter is the largest planet in the solar system. Its Great Red Spot is a huge storm that has lasted for centuries.",
    tags: ["Largest Planet", "Gas Giant", "Great Red Spot", "Many Moons"],
  },
  Saturn: {
    type: "Gas Giant",
    color: "#e8d374",
    glow: "rgba(232,211,116,0.5)",
    stats: ["116,460 km", "146", "29.5 y", "-140 °C"],
    description: "Saturn is famous for its bright rings made of ice and rock. It is a gas giant with many moons, including Titan.",
    tags: ["Ring System", "Gas Giant", "Titan", "Low Density"],
  },
  Uranus: {
    type: "Ice Giant",
    color: "#7ec8e3",
    glow: "rgba(126,200,227,0.5)",
    stats: ["50,724 km", "27", "84 y", "-195 °C"],
    description: "Uranus rotates on its side, giving it unusual seasons. Methane in its atmosphere gives the planet a blue-green color.",
    tags: ["Ice Giant", "Tilted Axis", "Blue-Green", "Cold"],
  },
  Neptune: {
    type: "Ice Giant",
    color: "#3f54ba",
    glow: "rgba(63,84,186,0.5)",
    stats: ["49,244 km", "14", "164.8 y", "-200 °C"],
    description: "Neptune is the farthest major planet from the Sun. It has powerful winds and a deep blue color caused by methane in its atmosphere.",
    tags: ["Farthest Planet", "Ice Giant", "Strong Winds", "Deep Blue"],
  },
};

const planetItems = document.querySelectorAll(".planet-item");
const detailDot = document.querySelector(".detail-planet-dot");
const detailName = document.querySelector(".detail-name");
const detailType = document.querySelector(".detail-type");
const statValues = document.querySelectorAll(".stat-value");
const detailBody = document.querySelector(".detail-body p");
const detailTags = document.querySelector(".detail-tags");

function showPlanetDetails(planetName) {
  const details = planetDetails[planetName];
  if (!details) return;

  planetItems.forEach((item) => {
    const label = item.querySelector(".planet-label")?.textContent?.trim();
    item.classList.toggle("active", label === planetName);
  });

  if (detailDot) {
    detailDot.style.background = details.color;
    detailDot.style.boxShadow = \`0 0 8px \${details.glow}\`;
  }
  if (detailName) detailName.textContent = planetName;
  if (detailType) detailType.textContent = details.type;
  statValues.forEach((value, index) => {
    value.textContent = details.stats[index] ?? "";
  });
  if (detailBody) detailBody.textContent = details.description;
  if (detailTags) {
    detailTags.innerHTML = details.tags.map((tag) => \`<span class="tag">\${tag}</span>\`).join("");
  }
}

planetItems.forEach((item) => {
  const label = item.querySelector(".planet-label")?.textContent?.trim();
  item.addEventListener("click", () => {
    if (label) showPlanetDetails(label);
  });
});
`;
}

function getCannedLayoutEdit(message: string, files: FileItem[]): TutorEditResult | null {
  if (!isLayoutRequest(message) || isInteractiveRequest(message)) {
    return null;
  }

  const indexFile = findFile(files, "index.html");
  const styleFile = findFile(files, "style.css");
  const changes: TutorEditResult["changes"] = [];

  if (indexFile?.proposedContent) {
    changes.push({
      fileName: "index.html",
      status: "modified",
      content: indexFile.proposedContent,
      ...countFallbackChangedLines(indexFile.content, indexFile.proposedContent),
    });
  }

  if (styleFile?.proposedContent) {
    changes.push({
      fileName: "style.css",
      status: "modified",
      content: styleFile.proposedContent,
      ...countFallbackChangedLines(styleFile.content, styleFile.proposedContent),
    });
  }

  if (changes.length === 0) {
    return null;
  }

  return {
    message:
      "I interpreted the bottom detail panel as the planet fact panel and moved it into a right-side sidebar with a vertical layout. Review the diffs in `index.html` and `style.css`, then accept the changes if the layout feels right.",
    changes,
  };
}

function getCannedPlanetClickEdit(message: string, files: FileItem[]): TutorEditResult | null {
  if (!isPlanetClickRequest(message)) {
    return null;
  }

  const indexFile = findFile(files, "index.html");
  if (!indexFile?.content?.includes("planet-item") || !indexFile.content.includes("detail-panel")) {
    return null;
  }

  const scriptFile = findFile(files, "script.js");
  const nextIndexContent = withScriptReference(indexFile.content);
  const scriptContent = buildPlanetClickScript();
  const changes: TutorEditResult["changes"] = [];

  if (nextIndexContent !== indexFile.content) {
    changes.push({
      fileName: "index.html",
      status: "modified",
      content: nextIndexContent,
      ...countFallbackChangedLines(indexFile.content, nextIndexContent),
    });
  }

  changes.push({
    fileName: "script.js",
    status: scriptFile ? "modified" : "new",
    content: scriptContent,
    ...countFallbackChangedLines(scriptFile?.content ?? "", scriptContent),
  });

  return {
    message:
      "I added a dedicated `script.js` file that stores details for each planet, listens for clicks on the planet list, updates the active state, and rewrites the existing detail panel instead of duplicating the Earth markup.",
    changes,
  };
}

export function getNoKeyTutorFallback(message: string, files: FileItem[]): TutorEditResult {
  const planetClickEdit = getCannedPlanetClickEdit(message, files);
  if (planetClickEdit) {
    return planetClickEdit;
  }

  const layoutEdit = getCannedLayoutEdit(message, files);
  if (!layoutEdit) {
    return {
      message:
        "Add a Tutor API key in Settings to let me make project-specific edits from any prompt. Without a key, this prototype only has a few canned demo edits available.",
      changes: [],
    };
  }

  return layoutEdit;
}

export function getUnsafeEditFallback(message?: string, files?: FileItem[]): TutorEditResult {
  const planetClickEdit = message && files ? getCannedPlanetClickEdit(message, files) : null;
  if (planetClickEdit) {
    return planetClickEdit;
  }

  const layoutEdit = message && files ? getCannedLayoutEdit(message, files) : null;
  if (layoutEdit) {
    return layoutEdit;
  }

  return {
    message:
      "I tried to make that change, but I couldn't produce a safe edit plan this time. Try again with the same goal, or add the most relevant file as context so I can target the right structure.",
    changes: [],
  };
}
