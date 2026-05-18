import styles from "./MarkdownInstructions.module.scss";

export function PortfolioInstructions() {
  return (
    <>
      <section className={styles.card}>
        <h2 className={styles.heading}>Build Your Personal Portfolio</h2>
        <p className={styles.text}>
          Create a one-page portfolio that introduces who you are, highlights a
          project you&apos;re proud of, and includes links to your work.
        </p>
        <p className={styles.text}>Your page should include:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            A header with your name and a short tagline.
          </li>
          <li className={styles.listItem}>
            At least one section with a heading, paragraph text, and an image or
            placeholder.
          </li>
          <li className={styles.listItem}>
            A navigation bar with links to different sections of the page.
          </li>
          <li className={styles.listItem}>
            CSS styling that feels intentional — colors, fonts, and spacing that
            reflect your personal brand.
          </li>
        </ul>
      </section>

      <section className={styles.card}>
        <p className={`${styles.text} ${styles.textStrong}`}>Helpful Steps</p>
        <ol className={styles.list}>
          <li className={styles.listItem}>
            Start with the HTML structure: header, nav, main content, and
            footer.
          </li>
          <li className={styles.listItem}>
            Open <strong>styles.css</strong> and choose a color palette — try
            two or three colors that work well together.
          </li>
          <li className={styles.listItem}>
            Use the <strong>Preview</strong> panel to see your changes in
            real-time.
          </li>
          <li className={styles.listItem}>
            Ask the <strong>AI Tutor</strong> if you get stuck — try prompts
            like &quot;How do I center this section?&quot; or &quot;Can you
            suggest a font pairing?&quot;
          </li>
        </ol>
      </section>

      <section className={styles.card}>
        <p className={`${styles.text} ${styles.textStrong}`}>Pro Tips</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            Save a version before making big changes so you can compare later.
          </li>
          <li className={styles.listItem}>
            Use semantic HTML elements like{" "}
            <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, and{" "}
            <code>&lt;footer&gt;</code> for better accessibility.
          </li>
          <li className={styles.listItem}>
            Consistency matters more than complexity — a simple, clean page
            beats a busy one.
          </li>
        </ul>
      </section>
    </>
  );
}
