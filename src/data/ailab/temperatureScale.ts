import type { AiLabDataset } from "../../types/aiLab";

/**
 * Sixteen afternoons. Cold days and very hot days stay in; warm days
 * mostly go out, with one warm day that doesn't — so a COLD / WARM / HOT
 * scale is almost the pattern, and not a perfect rule.
 */
const temperatures = [
  45, 48, 52, 55, 58, 61, 66, 72, 75, 80, 88, 92, 97, 101, 104, 108,
];
const wentOutside = [
  "no",
  "no",
  "no",
  "no",
  "no",
  "yes",
  "no",
  "yes",
  "yes",
  "yes",
  "yes",
  "yes",
  "yes",
  "no",
  "no",
  "no",
];

export const temperatureScaleDataset: AiLabDataset = {
  id: "afternoon_temperature",
  name: "Afternoon plans",
  description:
    "16 afternoons. Temperature is a number. Went outside is yes or no.",
  defaultLabelColumn: "went_outside",
  columns: [
    {
      id: "day",
      name: "Day",
      type: "categorical",
      description: "Which afternoon this row is.",
    },
    {
      id: "temperature",
      name: "Temperature",
      type: "numerical",
      description: "The temperature that afternoon, in degrees.",
    },
    {
      id: "went_outside",
      name: "Went outside",
      type: "categorical",
      description: "Whether they went outside.",
    },
  ],
  rows: temperatures.map((temperature, index) => ({
    day: `Day ${index + 1}`,
    temperature,
    went_outside: wentOutside[index],
  })),
  story: {
    rowNoun: "afternoon",
    whatIsARow:
      "Each row is one afternoon: how warm it was, and whether someone went outside.",
    source: "A class wrote down 16 afternoons from the past month.",
    question: "From the temperature, did they go outside?",
    whyItMatters:
      "A number can be turned into names like COLD or HOT. Those names are a choice, and the model will treat the choice as if it were in the data.",
  },
};
