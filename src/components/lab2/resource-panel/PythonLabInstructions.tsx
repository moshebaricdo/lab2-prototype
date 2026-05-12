import styles from "./InstructionsDrawer.module.scss";

export function PythonLabInstructions() {
  return (
    <>
      <section className={styles.card}>
        <h2 className={styles.heading}>
          Customize a Daily Check-In Planner
        </h2>
        <p className={styles.text}>
          Your goal is to explore a small Python script that asks for a name,
          builds a coding plan, and prints the result in the console.
        </p>
        <p className={styles.text}>Make sure to:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            Run <code>main.py</code> once before changing anything so you know
            what the starter project does.
          </li>
          <li className={styles.listItem}>
            Read <code>README.md</code> for ideas about how to customize the
            project.
          </li>
          <li className={styles.listItem}>
            Keep the <code>input()</code> prompt, helper functions, and
            multi-line output working after your edits.
          </li>
        </ul>
      </section>

      <section className={styles.card}>
        <p className={`${styles.text} ${styles.textStrong}`}>Helpful Steps</p>
        <ol className={styles.list}>
          <li className={styles.listItem}>
            Open <code>main.py</code>, hit <strong>Run</strong>, and look for
            the greeting plus three focus steps in the console.
          </li>
          <li className={styles.listItem}>
            Update the <code>FOCUS_OPTIONS</code> list with coding habits or
            goals that feel useful to you.
          </li>
          <li className={styles.listItem}>
            Add a new entry to <code>ENCOURAGEMENTS</code> for your name or a
            classmate&apos;s name.
          </li>
          <li className={styles.listItem}>
            Ask the <strong>AI Tutor</strong> if you get stuck &mdash; try
            prompts like &quot;What does <code>enumerate()</code> do?&quot; or
            &quot;How does this dictionary lookup work?&quot;
          </li>
        </ol>
      </section>

      <section className={styles.card}>
        <p className={`${styles.text} ${styles.textStrong}`}>Pro Tips</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            Use the <strong>Console</strong> to check your output after every
            change &mdash; small, frequent runs catch mistakes early.
          </li>
          <li className={styles.listItem}>
            Save a version before experimenting with bigger changes so you can
            always go back.
          </li>
          <li className={styles.listItem}>
            Function names like <code>clean_name</code> and{" "}
            <code>build_focus_plan</code> tell readers what each part of the
            program is responsible for.
          </li>
        </ul>
      </section>
    </>
  );
}
