import { Link, useLocation } from "react-router-dom";
import {
  Button,
  Checkbox,
  CadsProvider,
  IconToggle,
  Radio,
  SegmentedButton,
  Tag,
  TextField,
  Tooltip,
  cadsManifest,
} from "@moshebaricdo/cads-react";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import { useTheme } from "../../hooks/useTheme";
import styles from "./CadsParityPage.module.scss";

/**
 * Parity sandbox for `@moshebaricdo/cads-*` packages (GitHub Packages).
 * Local App* components remain the Lab2 prototype atoms — this route is for
 * evaluating packaged CADS components side-by-side, not a big-bang replace.
 */
export default function CadsParityPage() {
  const location = useLocation();
  const { theme } = useTheme();

  return (
    <div
      className={`${styles.page} ${theme === "dark" ? "dark" : ""}`}
      data-theme={theme}
    >
      <header className={styles.header}>
        <Link to="/levels" className={styles.logoLink}>
          CADS parity
        </Link>
        <nav className={styles.nav}>
          <Link
            to="/design-system/colors"
            className={
              location.pathname.startsWith("/design-system/colors")
                ? styles.navActive
                : undefined
            }
          >
            Colors
          </Link>
          <Link
            to="/design-system/typography"
            className={
              location.pathname.startsWith("/design-system/typography")
                ? styles.navActive
                : undefined
            }
          >
            Typography
          </Link>
          <Link
            to="/design-system/cads"
            className={
              location.pathname.startsWith("/design-system/cads")
                ? styles.navActive
                : undefined
            }
          >
            CADS packages
          </Link>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.title}>@moshebaricdo/cads-react</h1>
          <p className={styles.lede}>
            Packaged MUI-wrapped CADS components from the sibling{" "}
            <code>cads</code> repo. Lab2 <code>App*</code> atoms are unchanged —
            use this route to compare fidelity and opt new prototypes into the
            packages. Manifest v{cadsManifest.version} ·{" "}
            {cadsManifest.components.length} entries.
          </p>
        </div>

        <CadsProvider baseline={false}>
          <section className={styles.section}>
            <h2>Button</h2>
            <div className={styles.row}>
              <Button variant="contained" color="primary">
                Contained primary
              </Button>
              <Button variant="outlined" color="secondary">
                Outlined
              </Button>
              <Button variant="text" color="primary">
                Text
              </Button>
              <Button
                variant="contained"
                color="primary"
                endIconName="arrow-right"
              >
                With icon
              </Button>
              <Button variant="contained" color="error" size="small">
                Error small
              </Button>
            </div>
          </section>

          <section className={styles.section}>
            <h2>SegmentedButton</h2>
            <div className={styles.row}>
              <SegmentedButton
                aria-label="View mode"
                defaultValue="list"
                options={[
                  { value: "list", label: "List" },
                  { value: "grid", label: "Grid" },
                  { value: "map", label: "Map" },
                ]}
              />
            </div>
          </section>

          <section className={styles.section}>
            <h2>IconToggle</h2>
            <div className={styles.row}>
              <IconToggle iconName="heart" color="brand" aria-label="Favorite" />
              <IconToggle
                iconName="star"
                color="brand"
                label="Rating"
                secondToggle={{
                  iconName: "thumbs-up",
                  "aria-label": "Upvote",
                }}
              />
            </div>
          </section>

          <section className={styles.section}>
            <h2>TextField</h2>
            <div className={styles.row}>
              <TextField label="Email" size="medium" placeholder="you@code.org" />
              <TextField
                label="Error"
                size="medium"
                error
                helperText="Required"
                defaultValue=""
              />
              <TextField label="Small" size="small" />
            </div>
          </section>

          <section className={styles.section}>
            <h2>Checkbox &amp; Radio</h2>
            <div className={styles.row}>
              <Checkbox label="Remember me" defaultChecked />
              <Checkbox label="Unchecked" />
              <Radio label="Option A" name="parity-radio" value="a" defaultChecked />
              <Radio label="Option B" name="parity-radio" value="b" />
            </div>
          </section>

          <section className={styles.section}>
            <h2>Tag &amp; Tooltip</h2>
            <div className={styles.row}>
              <Tag color="neutral" label="Neutral" />
              <Tag color="brand" label="Brand" />
              <Tag color="success" label="Passed" startIconName="check" />
              <Tag color="error" label="Failed" />
              <Tooltip title="Save your progress">
                <span>
                  <Button size="small" variant="outlined">
                    Hover me
                  </Button>
                </span>
              </Tooltip>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Icons</h2>
            <div className={styles.row}>
              <FaIcon name="arrow-right" size="large" title="Arrow right" />
              <FaIcon name="check" size="large" title="Check" />
              <FaIcon name="xmark" size="large" title="Close" />
              <FaIcon name="gear" size="large" title="Settings" />
            </div>
          </section>
        </CadsProvider>

        <section className={styles.section}>
          <h2>Manifest (AI substrate)</h2>
          <pre className={styles.manifest}>
            {JSON.stringify(
              cadsManifest.components.map((c) => ({
                name: c.name,
                props: c.props.map((p) => p.name),
              })),
              null,
              2,
            )}
          </pre>
        </section>
      </main>
    </div>
  );
}
