import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./PlanMarkdownPreview.module.scss";

interface PlanMarkdownPreviewProps {
  markdown: string;
}

export function PlanMarkdownPreview({ markdown }: PlanMarkdownPreviewProps) {
  return (
    <div className={styles.root}>
      <div className={styles.scrollArea}>
        <article className={styles.content}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
