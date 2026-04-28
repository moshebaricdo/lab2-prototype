import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./InstructionsDrawer.module.scss";

interface MarkdownInstructionsProps {
  markdown: string;
}

export function MarkdownInstructions({ markdown }: MarkdownInstructionsProps) {
  return (
    <section className={styles.card}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className={styles.heading}>{children}</h2>,
          h2: ({ children }) => <h2 className={styles.heading}>{children}</h2>,
          h3: ({ children }) => <p className={styles.stepTitle}>{children}</p>,
          p: ({ children }) => <p className={styles.text}>{children}</p>,
          strong: ({ children }) => (
            <strong className={styles.textStrong}>{children}</strong>
          ),
          ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.list}>{children}</ol>,
          li: ({ children }) => <li className={styles.listItem}>{children}</li>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </section>
  );
}
