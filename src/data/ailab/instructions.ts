import type { AiLabSection } from "../../types/aiLab";

export const aiLabSectionInstructions: Record<AiLabSection, string> = {
  algorithm: [
    "# Choose an algorithm",
    "Pick how this model will learn from the rows in the sheet.",
    "- **K-Nearest Neighbors** looks at similar past examples.",
    "- **Decision Tree** asks a series of yes/no questions about the columns.",
    "Curriculum levels can lock this choice. Here you can try both.",
  ].join("\n\n"),
  dataset: [
    "# Explore the dataset",
    "If a dataset is not already chosen, pick one first. You can change it later from the header.",
    "The sheet works like a spreadsheet. Click a cell to select it, double-click or type to edit, and click a column header to inspect how its values are spread.",
    "Use the **Train** rail on the right to choose what to predict and which columns the model can see, then train.",
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
    "Accuracy is how often the model’s prediction matches the label.",
    "Fill the fields in the dock. The visualization updates as soon as every feature has a value.",
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
    "# Work in the sheet",
    "Each row is one taco-truck order.",
    "Click a cell to select it. Double-click, press Enter, or start typing to edit. Arrow keys move like a spreadsheet. Click a column header to inspect how its values are spread. Switch Table / Cards above the sheet to browse rows as a catalog or carousel.",
    "The **Train model** card on the right is where you choose what to **Predict** and which columns to use, then **Train model**. Accuracy lands in the **Results** card underneath and **Test model** lights up. Weekday is in the guided dataset on purpose. Editing a cell clears the current model.",
  ].join("\n\n"),
  train: [
    "# Train a model",
    "Training lives in the Train rail beside the sheet of orders.",
    "1. Choose the label (what to predict).",
    "2. Check the features to include. Try leaving weekday out, then add it and train again.",
    "Train unlocks the Testing tab. Switching algorithms keeps your label and features.",
  ].join("\n\n"),
  test: [
    "# Test the model",
    "This is a dashboard, not another form. The big number is accuracy (leave-one-out on this small sheet). The visualization is how the model thinks.",
    "The dock at the bottom is **Input → Output**: fill the inputs (or **Use a row** from the sheet) and the Output card answers as you go. Decision Tree highlights the path; use Previous / Next to step it. KNN lists the neighbors that voted — distance is not scaled, so a wide-range column can outweigh the others.",
  ].join("\n\n"),
};

export const aiLabStudioSectionInstructions: Record<AiLabSection, string> = {
  algorithm: [
    "# Choose an algorithm",
    "Pick how the model will learn from the dataset you chose.",
    "- **K-Nearest Neighbors** finds the closest past rows and lets them vote.",
    "- **Decision Tree** asks a short series of questions about the columns you pick.",
    "You can switch algorithms later without losing the dataset.",
  ].join("\n\n"),
  dataset: [
    "# Choose data, then train",
    "A single setup modal asks for dataset and algorithm (whichever the levelbuilder did not lock). Change both later from the same header chip.",
    "The **Train model** card on the right: choose what to **Predict** and which columns to use, then **Train model**. The **Results** card underneath holds accuracy plus **Scorecard**, **Save model**, and **Test model** — the same Scorecard / Save model controls sit on the Testing metric strip, so they are always in reach once a model exists.",
  ].join("\n\n"),
  train: [
    "# Train a model",
    "Training lives in the Train rail beside the sheet.",
    "1. Choose the label (what to predict).",
    "2. Check the features to include.",
    "Train unlocks Testing. **Scorecard** and **Save model** live in the Results card under the Train model card.",
  ].join("\n\n"),
  test: [
    "# Test, inspect, export",
    "The dashboard is for trying a new example. The **Input → Output** dock at the bottom is the action — fill the inputs (or **Use a row**) and the Output card answers live.",
    "**Scorecard** and **Save model** on the metric strip (same controls as the Data Set Results card) open the scorecard and, when export is on, the model card / `getPrediction` snippet.",
    "Click a scorecard row to load that example into this dock.",
  ].join("\n\n"),
};

export const aiLabPretrainedInstructions = [
  "# Audit a trained model",
  "This lesson starts with a model someone else already trained on taco-truck orders.",
  "Read the accuracy, then try new feature values in the dock. The visualization shows *how* the model reached each prediction.",
].join("\n\n");
