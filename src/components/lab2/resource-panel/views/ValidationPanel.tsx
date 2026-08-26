import { useEffect, useMemo, useState } from "react";
import { Button } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import type { FaIconName } from "../../../../icons/faProRegularCodepoints";
import type { FileItem } from "../../../../types/file";
import type {
  ValidationStatus,
  ValidationTestDefinition,
} from "../../../../types/validation";
import styles from "./ValidationPanel.module.scss";

interface ValidationPanelProps {
  fileStructure?: FileItem[];
  tests?: ValidationTestDefinition[];
}

interface SourceFile {
  name: string;
  path: string;
  content: string;
}

function flattenFiles(items: FileItem[] = [], parentPath = ""): SourceFile[] {
  return items.flatMap((item) => {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.type === "folder") {
      return flattenFiles(item.children ?? [], itemPath);
    }
    return [{
      name: item.name,
      path: itemPath,
      content: item.content ?? "",
    }];
  });
}

function getTestSource(files: SourceFile[], targetFile?: string) {
  if (!targetFile) {
    return files.map((file) => file.content).join("\n\n");
  }

  return files.find((file) => file.path === targetFile || file.name === targetFile)
    ?.content ?? "";
}

function evaluateTest(test: ValidationTestDefinition, files: SourceFile[]): ValidationStatus {
  if (!test.matcher) return "skip";

  const source = getTestSource(files, test.targetFile);
  if (!source) return "fail";

  if (test.matcher.type === "includes") {
    return source.includes(test.matcher.value) ? "pass" : "fail";
  }

  try {
    const regex = new RegExp(test.matcher.value, test.matcher.flags);
    return regex.test(source) ? "pass" : "fail";
  } catch {
    return "skip";
  }
}

function statusLabel(status: ValidationStatus) {
  if (status === "pass") return "Pass";
  if (status === "fail") return "Fail";
  return "Skip";
}

function statusIconName(status: ValidationStatus): FaIconName {
  if (status === "pass") return "circle-check";
  if (status === "fail") return "circle-xmark";
  return "circle-minus";
}

function statusClassName(status: ValidationStatus) {
  if (status === "pass") return styles.pass;
  if (status === "fail") return styles.fail;
  return styles.skip;
}

export function ValidationPanel({
  fileStructure = [],
  tests = [],
}: ValidationPanelProps) {
  const files = useMemo(() => flattenFiles(fileStructure), [fileStructure]);
  const sourceFingerprint = useMemo(
    () => files.map((file) => `${file.path}:${file.content}`).join("\n---\n"),
    [files],
  );
  const [results, setResults] = useState<Record<string, ValidationStatus>>({});

  useEffect(() => {
    setResults({});
  }, [sourceFingerprint, tests]);

  const handleValidate = () => {
    setResults(Object.fromEntries(
      tests.map((test) => [test.id, evaluateTest(test, files)]),
    ));
  };

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        {tests.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No validation tests configured</p>
            <p className={styles.emptyText}>
              Add tests from the dev panel to validate this level.
            </p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.headerRow}>
              <div className={styles.headerCell}>Test</div>
              <div className={`${styles.headerCell} ${styles.headerCellResult}`}>Result</div>
            </div>

            {tests.map((test) => {
              const status = results[test.id] ?? "skip";
              return (
                <div key={test.id} className={styles.row}>
                  <p className={styles.description}>{test.description}</p>
                  <div className={styles.resultCell}>
                    <FaIcon
                      name={statusIconName(status)}
                      size="m"
                      className={`${styles.icon} ${statusClassName(status)}`}
                    />
                    <p className={styles.statusText}>
                      {statusLabel(status)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button
          variant="contained"
          color="primary"
          size="small"
          startIconName="clipboard-check"
          fullWidth
          onClick={handleValidate}
          disabled={tests.length === 0}
        >
          Validate
        </Button>
      </div>
    </div>
  );
}
