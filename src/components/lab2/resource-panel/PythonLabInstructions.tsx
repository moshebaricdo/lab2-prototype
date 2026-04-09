import styles from "./InstructionsDrawer.module.scss";

export function PythonLabInstructions() {
  return (
    <>
      <section className={styles.card}>
        <h2 className={styles.heading}>
          Write a Python Program That Greets the User
        </h2>
        <p className={styles.text}>
          Your goal is to write a short Python script that asks the user for
          their name and prints a personalized greeting.
        </p>
        <p className={styles.text}>Make sure to:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            Use <code>input()</code> to ask for the user&apos;s name and store
            it in a variable.
          </li>
          <li className={styles.listItem}>
            Use <code>print()</code> with an f-string to display a greeting that
            includes their name.
          </li>
          <li className={styles.listItem}>
            Add a comment at the top of your file explaining what the program
            does.
          </li>
        </ul>
      </section>

      <section className={styles.card}>
        <p className={`${styles.text} ${styles.textStrong}`}>Helpful Steps</p>
        <ol className={styles.list}>
          <li className={styles.listItem}>
            Start by writing a simple <code>print(&quot;Hello world!&quot;)</code>{" "}
            statement and hit <strong>Run</strong> to make sure everything works.
          </li>
          <li className={styles.listItem}>
            Add a variable using <code>input()</code> to capture the
            user&apos;s name, for example:{" "}
            <code>name = input(&quot;What is your name? &quot;)</code>
          </li>
          <li className={styles.listItem}>
            Replace your print statement with an f-string:{" "}
            <code>print(f&quot;Hello, &#123;name&#125;!&quot;)</code>
          </li>
          <li className={styles.listItem}>
            Ask the <strong>AI Tutor</strong> if you get stuck &mdash; try
            prompts like &quot;How do f-strings work?&quot; or &quot;What does{" "}
            <code>input()</code> return?&quot;
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
            Save a version before experimenting so you can always go back.
          </li>
          <li className={styles.listItem}>
            Descriptive variable names like <code>user_name</code> make your
            code easier to read than single letters like <code>x</code>.
          </li>
        </ul>
      </section>
    </>
  );
}
