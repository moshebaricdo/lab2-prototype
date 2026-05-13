import type { FileItem } from "../../../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../../../types/validationReview";
import photo1Url from "./files/6ecdd334-d9e8-4425-9468-2976df16571f.png?inline";
import photo2Url from "./files/8435cb23-6c4c-4306-b3a5-c704a344407a.png?inline";
import indexHtml from "./files/index.html?raw";
import validationTestInstructionsMarkdown from "./instructions.md?raw";
import scriptJs from "./files/script.js?raw";
import stylesCss from "./files/style.css?raw";

export const validationTestFileStructure: FileItem[] = [
  {
    name: "Validation Test",
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
        content: stylesCss,
      },
      {
        name: "script.js",
        type: "file",
        content: scriptJs,
      },
      {
        name: "photo1.png",
        type: "image",
        content: photo1Url,
      },
      {
        name: "photo2.png",
        type: "image",
        content: photo2Url,
      },
    ],
  },
];

export { validationTestInstructionsMarkdown };

export const validationTestReviewConfig: WebLab2ValidationReviewConfig = {
  mode: "technical",
  title: "Photo button bug review",
  goals: [
    "The Next button is wired to a click handler.",
    "The click handler updates the caption.",
    "The click handler shows the second photo.",
  ],
  checks: [
    {
      id: "next-button-click-listener",
      label: "Next button has a click listener",
      targetFile: "script.js",
      matcher: {
        type: "regex",
        value: "querySelector\\([\"']#next[\"']\\)\\.addEventListener\\([\"']click[\"']",
      },
      passDetail: "The script listens for clicks on the Next button.",
      failDetail: "Check that the script selects #next and adds a click listener.",
    },
    {
      id: "caption-updates",
      label: "Caption changes on click",
      targetFile: "script.js",
      matcher: {
        type: "includes",
        value: "textContent",
      },
      passDetail: "The click handler updates text on the page.",
      failDetail: "Make sure the click handler changes the caption text.",
    },
    {
      id: "second-photo-selector",
      label: "Second photo selector matches the HTML",
      targetFile: "script.js",
      matcher: {
        type: "regex",
        value: "querySelector\\([\"']#photo2[\"']\\)",
      },
      passDetail: "The script now targets #photo2, which exists in the HTML.",
      failDetail: "The HTML uses #photo2. Update the JavaScript selector so it matches.",
    },
  ],
  minimumChangedFiles: 1,
};
