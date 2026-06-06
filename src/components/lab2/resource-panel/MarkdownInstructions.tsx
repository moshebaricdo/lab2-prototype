import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stripInstructionAuthoringMetadata } from "../../../lib/tutor/instruction/instructionGuide";
import styles from "./MarkdownInstructions.module.scss";

interface MarkdownInstructionsProps {
  markdown: string;
}

export function MarkdownInstructions({ markdown }: MarkdownInstructionsProps) {
  const studentMarkdown = stripInstructionAuthoringMetadata(markdown);
  const sections = studentMarkdown
    .split(/^\s*---\s*$/m)
    .map((section) => section.trim())
    .filter(Boolean);

  return (
    <>
      {sections.map((section, index) => (
        <section className={styles.card} key={index}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className={styles.heading}>{children}</h1>,
              h2: ({ children }) => (
                <h2 className={`${styles.heading} ${styles.headingSecondary}`}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => <h3 className={styles.stepTitle}>{children}</h3>,
              p: ({ children }) => <p className={styles.text}>{children}</p>,
              strong: ({ children }) => (
                <strong className={styles.textStrong}>{children}</strong>
              ),
              ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
              ol: ({ children }) => <ol className={styles.list}>{children}</ol>,
              li: ({ children }) => <li className={styles.listItem}>{children}</li>,
              hr: () => <hr className={styles.rule} />,
            }}
          >
            {section}
          </ReactMarkdown>
        </section>
      ))}
    </>
  );
}
