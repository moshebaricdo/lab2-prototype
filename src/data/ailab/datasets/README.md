# AI Lab CSV drop folder

Drop any `*.csv` here and it shows up in the AI Lab studio dataset picker
(`/levels/ailab`) on the next dev reload or build. Nothing to register.

How a file is read (`src/lib/aiLab/csvDataset.ts`):

- First row is the header. Blank headers are dropped; duplicate names get a
  numeric suffix.
- A column is **numerical** when every non-blank cell is a number; otherwise
  **categorical**. Cells are trimmed (`"Negative "` → `"Negative"`).
- The **last column** is the default label. Fully blank rows are skipped.
- Dataset id = file name slug (`Online Food.csv` → `online_food`); display
  name is the humanized slug.

To override the display name, description, label column, or per-column
descriptions (shown in column analysis), add an entry to `overrides` in
`index.ts` keyed by that slug. Column description keys use the column id
slug (`Has feathers` → `has_feathers`).

Keep files modest (a few hundred rows). Everything trains in the browser and
the spreadsheet renders every row.

A matching PNG in `covers/`, named with that same slug (`covers/bird_mammal_fish.png`),
is the dataset's cover in the chooser. Datasets without one show a table icon on a neutral fill.

The starter file offered from **Choose a dataset** and the Dev panel **Add a dataset** lives one folder up
(`../dataset-template.csv`). Keep it out of this folder so it does not join
the studio catalog.
