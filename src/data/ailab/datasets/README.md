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

To override the display name, description, or label column for a file, add
an entry to `overrides` in `index.ts` keyed by that slug.

Keep files modest (a few hundred rows). Everything trains in the browser and
the spreadsheet renders every row.
