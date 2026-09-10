import type { AiLabSection } from "../../types/aiLab";

export const aiLabSectionInstructions: Record<AiLabSection, string> = {
  algorithm: [
    "# Choose an algorithm",
    "Pick how this model will learn from the taco-truck orders.",
    "- **K-Nearest Neighbors** looks at similar past orders.",
    "- **Decision Tree** asks a series of yes/no questions about the columns.",
    "Curriculum levels can lock this choice. Here you can try both.",
  ].join("\n\n"),
  dataset: [
    "# Explore the dataset",
    "Look through the taco-truck orders before you train.",
    "Switch between the **table** and **cards** views. Click a column in the table to see what kind of data it is.",
    "You are not choosing a label or features yet — that happens in Train.",
  ].join("\n\n"),
  train: [
    "# Train a model",
    "Build a statement: **Predict** a column **based on** one or more other columns.",
    "1. Click the column you want to predict and set it as the label.",
    "2. Add one or more feature columns the model can use.",
    "3. Choose **Train model** when the statement looks right.",
  ].join("\n\n"),
  test: [
    "# Test the model",
    "See how the model did on reserved orders, then try your own example.",
    "Click a result row to fill **Try it out**. Decision Tree shows the path through the questions. KNN shows the nearest orders in a scatter plot.",
  ].join("\n\n"),
};

export const aiLabGuidedSectionInstructions: Record<AiLabSection, string> = {
  algorithm: [
    "# Choose an algorithm",
    "Read both options, then continue. You can switch algorithms later without losing the dataset.",
    "- **K-Nearest Neighbors** finds the closest past orders and lets them vote.",
    "- **Decision Tree** asks a short series of questions about the columns you pick.",
    "Neither is “the right one” for this lesson — try both after you train.",
  ].join("\n\n"),
  dataset: [
    "# Explore the dataset",
    "Each row is one taco-truck order. **Reserved** rows are held out for Test so the model cannot memorize them.",
    "Use **Table** or **Cards**. Cards can be a catalog of every order or a carousel that shows one at a time. Click a column name to inspect how its values are spread.",
    "When you are ready, open **Set up training** on this same sheet — it is a setup row on the data, not a different place. Weekday is in the data on purpose — ask whether it should help predict a repeat order.",
  ].join("\n\n"),
  train: [
    "# Train a model",
    "The setup row sits on the dataset, like a filter row on a spreadsheet. Finish the statement: **Predict** a category **based on** the columns the model is allowed to see.",
    "1. Choose the label (what to predict).",
    "2. Check the features to include. Try leaving weekday out, then add it and train again.",
    "3. If you picked KNN, set **k** — how many nearby orders vote.",
    "Train unlocks the Test tab. Hide setup to look at the sheet again. Switching algorithms keeps your label and features.",
  ].join("\n\n"),
  test: [
    "# Test the model",
    "Accuracy is only the reserved orders — examples the model did not train on.",
    "Fill **Try it out** and the visualization updates as soon as every feature has a value. Click a reserved row to load that order.",
    "For KNN, the list under the form is the actual neighbors that voted. Distance is not scaled, so a wide-range column can outweigh the others.",
  ].join("\n\n"),
};

export const aiLabPretrainedInstructions = [
  "# Audit a trained model",
  "This lesson starts with a model someone else already trained on taco-truck orders.",
  "Read the reserved-order results, then try new feature values. The visualization shows *how* the model reached each prediction.",
].join("\n\n");
