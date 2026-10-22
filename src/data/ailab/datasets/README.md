# AI Lab CSV drop folder

Drop any `*.csv` here and it shows up in the AI Lab studio dataset picker
(`/levels/ailab` and `/levels/ailab-upload`) on the next dev reload or build.
Nothing to register.

How a file is read (`src/lib/aiLab/csvDataset.ts`):

- First row is the header. Blank headers are dropped; duplicate names get a
  numeric suffix.
- A column is **numerical** when every non-blank cell is a number (unless a
  matching `*.json` marks the field `categorical`); otherwise **categorical**.
  Cells are trimmed (`"Negative "` → `"Negative"`).
- The **last column** is the default label unless overridden by a matching
  `*.json` (`defaultLabelColumn`) or `overrides` in `index.ts`. Fully blank
  rows are skipped.
- Dataset id = file name slug (`Online Food.csv` → `online_food`); display
  name is the humanized slug.
- Catalog entries are created with `lazy: true`: row and column counts (`rowCount`,
  `columnCount`) and card metadata are available immediately for the chooser
  cards, while full CSV row parsing happens on first access to `rows` or `columns`.

A matching `*.json` with the same slug (`zoo.json`) supplies production AI Lab
metadata (`card`, `defaultLabelColumn`, and `fields` with explicit column types
and descriptions). To override the display name, description, label column,
recommended algorithm, or per-column descriptions, add an entry to `overrides`
in `index.ts` keyed by that slug.

A matching PNG or JPG in `covers/`, named with that same slug (`covers/zoo.png`),
is the dataset's cover in the chooser. Datasets without
one show a table icon on a neutral fill.

The starter file offered from **Choose a dataset** and the Dev panel **Add a dataset** lives one folder up
(`../dataset-template.csv`). Keep it out of this folder so it does not join
the studio catalog.
