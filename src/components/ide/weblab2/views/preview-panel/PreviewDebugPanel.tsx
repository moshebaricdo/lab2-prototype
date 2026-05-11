import { AppButton } from "../../../../ui/AppButton";
import { AlertBanner } from "../../../../ui/AlertBanner";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import { Tooltip } from "../../../../ui/Tooltip";
import { SegmentedControl, type SegmentedOption } from "../SegmentedControl";
import type {
  PreviewConsoleMessage,
  PreviewDebugTab,
  PreviewNetworkRequest,
} from "./types";
import styles from "./PreviewDebugPanel.module.scss";

interface PreviewDebugPanelProps {
  activeTab: PreviewDebugTab;
  consoleMessages: PreviewConsoleMessage[];
  height: number;
  isNetworkBlocked: boolean;
  networkRequests: PreviewNetworkRequest[];
  selectedNetworkRequestId: string | null;
  onTabChange: (tab: PreviewDebugTab) => void;
  onClearAll: () => void;
  onToggleNetworkBlocked: () => void;
  onSelectNetworkRequest: (requestId: string) => void;
  onClose: () => void;
}

const DEBUG_TABS: SegmentedOption<PreviewDebugTab>[] = [
  { value: "console", label: "Console", iconName: "terminal" },
  { value: "network", label: "Network", iconName: "globe" },
];

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRequestTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getRequestName(url: string) {
  if (!url) return "Unknown request";

  try {
    const parsed = new URL(url, window.location.href);
    const lastSegment = parsed.pathname.split("/").filter(Boolean).at(-1);
    return lastSegment || parsed.hostname || url;
  } catch {
    const pathPart = url.split(/[?#]/, 1)[0] ?? url;
    return pathPart.split("/").filter(Boolean).at(-1) || url;
  }
}

function getStatusLabel(request: PreviewNetworkRequest) {
  if (request.status === "pending") return "Pending";
  if (request.status === "request-error") return "Request failed";
  const statusText = request.statusText ? ` ${request.statusText}` : "";
  return `${request.statusCode ?? "Unknown"}${statusText}`;
}

function getActivityStatusClass(request: PreviewNetworkRequest) {
  if (request.status === "success") return styles.statusSuccess;
  if (request.status === "pending") return styles.statusPending;
  return styles.statusFailure;
}

function getConnectorStatusClass(request: PreviewNetworkRequest) {
  if (request.status === "success") return styles.connectorsuccess;
  if (request.status === "pending") return styles.connectorpending;
  if (request.status === "response-error") return styles.connectorresponseError;
  return styles.connectorrequestError;
}

function copyText(value: string) {
  if (!value) return;
  void navigator.clipboard?.writeText(value);
}

function MetadataField({
  label,
  value,
  isCode = false,
  copyValue,
}: {
  label: string;
  value: string;
  isCode?: boolean;
  copyValue?: string;
}) {
  return (
    <div className={styles.metadataField}>
      <div className={styles.metadataLabelRow}>
        <span className={styles.metadataLabel}>{label}</span>
        {copyValue ? (
          <AppButton
            aria-label={`Copy ${label.toLowerCase()}`}
            className={styles.copyButton}
            iconName="copy"
            onClick={() => copyText(copyValue)}
            size="xs"
            tone="gray"
            variant="tertiary"
          />
        ) : null}
      </div>
      <div className={`${styles.metadataValue} ${isCode ? styles.metadataValueCode : ""}`}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({
  iconName,
  title,
  description,
}: {
  iconName: "terminal" | "globe";
  title: string;
  description: string;
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <FaIcon name={iconName} size="l" />
      </div>
      <h2 className={styles.emptyStateTitle}>{title}</h2>
      <p className={styles.emptyStateText}>{description}</p>
    </div>
  );
}

export function PreviewDebugPanel({
  activeTab,
  consoleMessages,
  height,
  isNetworkBlocked,
  networkRequests,
  selectedNetworkRequestId,
  onTabChange,
  onClearAll,
  onToggleNetworkBlocked,
  onSelectNetworkRequest,
  onClose,
}: PreviewDebugPanelProps) {
  const selectedRequest =
    networkRequests.find((request) => request.id === selectedNetworkRequestId) ??
    networkRequests[0] ??
    null;

  const renderHeader = () => (
    <div className={styles.header}>
      <div className={styles.headerTabs}>
        <SegmentedControl
          options={DEBUG_TABS}
          value={activeTab}
          onChange={onTabChange}
        />
      </div>
      <span className={styles.headerLabel}>DEBUG</span>
      <div className={styles.headerActions}>
        <AppButton
          aria-label="Clear debug output"
          iconName="eraser"
          onClick={onClearAll}
          size="xs"
          tone="gray"
          title="Clear debug output"
          variant="tertiary"
        />
        <AppButton
          aria-label="Close debug panel"
          iconName="xmark"
          onClick={onClose}
          size="xs"
          tone="gray"
          title="Close debug panel"
          variant="tertiary"
        />
      </div>
    </div>
  );

  const renderConsole = () => (
    <div className={styles.consolePane}>
      {consoleMessages.length === 0 ? (
        <EmptyState
          iconName="terminal"
          title="No console output"
          description="Add console.log() statements to your code to see output here."
        />
      ) : (
        <div className={styles.consoleList} role="log" aria-label="Console output">
          <AlertBanner
            className={styles.consoleHint}
            dismissible={false}
            sentiment="info"
            showIcon
            size="xs"
          >
            Console output from the current preview session appears below.
          </AlertBanner>
          {consoleMessages.map((message) => (
            <div
              key={message.id}
              className={`${styles.consoleRow} ${styles[`consoleLevel${message.level}`]}`}
            >
              <span className={styles.consoleLevel}>{message.level}</span>
              <pre className={styles.consoleMessage}>{message.message}</pre>
              <time className={styles.consoleTime} dateTime={message.timestamp}>
                {formatTimestamp(message.timestamp)}
              </time>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderActivityList = () => (
    <aside className={styles.activityList} aria-label="Network activity">
      <div className={styles.activityHeader}>
        <span>Activity</span>
        <Tooltip
          content={isNetworkBlocked ? "Unblock network activity" : "Block network activity"}
          position="bottom"
        >
          <AppButton
            aria-label={isNetworkBlocked ? "Unblock network activity" : "Block network activity"}
            aria-pressed={isNetworkBlocked}
            className={isNetworkBlocked ? styles.networkBlockButtonActive : ""}
            iconName="ban"
            onClick={onToggleNetworkBlocked}
            size="xs"
            tone="gray"
            variant="secondary"
          />
        </Tooltip>
      </div>
      {networkRequests.length === 0 ? (
        <p className={styles.activityEmpty}>No activity to show</p>
      ) : (
        <div className={styles.activityItems}>
          {networkRequests.map((request) => {
            const isSelected = selectedRequest?.id === request.id;
            return (
              <button
                key={request.id}
                type="button"
                className={`${styles.activityItem} ${isSelected ? styles.activityItemSelected : ""}`}
                aria-pressed={isSelected}
                onClick={() => onSelectNetworkRequest(request.id)}
              >
                <span className={`${styles.activityStatusDot} ${getActivityStatusClass(request)}`} />
                <span className={styles.activityText}>
                  <span className={styles.activityName}>{getRequestName(request.url)}</span>
                  <span className={styles.activityMeta}>
                    {request.method}
                    {request.durationMs != null ? ` · ${request.durationMs}ms` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );

  const renderRequestCard = (request: PreviewNetworkRequest) => (
    <section className={styles.detailCard}>
      <div className={styles.detailHeader}>
        <h3>Request</h3>
        <FaIcon name="arrow-right" size="xs" />
      </div>
      <div className={styles.detailBody}>
        {request.status === "request-error" && request.error ? (
          <AlertBanner
            className={styles.detailAlert}
            dismissible={false}
            sentiment="danger"
            showIcon
            size="xs"
          >
            {request.error}
          </AlertBanner>
        ) : null}
        <div className={styles.metadataGrid}>
          <MetadataField label="Method" value={request.method} />
          <MetadataField label="Request time" value={formatRequestTime(request.requestTime)} />
        </div>
        <MetadataField label="URL" value={request.url || "Unknown URL"} copyValue={request.url} />
      </div>
    </section>
  );

  const renderResponseCard = (request: PreviewNetworkRequest) => (
    <section className={`${styles.detailCard} ${request.status === "request-error" ? styles.detailCardCompact : ""}`}>
      <div className={styles.detailHeader}>
        <h3>Response</h3>
        <FaIcon
          name={request.status === "pending" ? "clock" : request.status === "success" ? "circle-check" : "circle-xmark"}
          size="xs"
        />
      </div>
      {request.status === "request-error" ? null : (
        <div className={styles.detailBody}>
          {request.status === "response-error" ? (
            <AlertBanner
              className={styles.detailAlert}
              dismissible={false}
              sentiment="danger"
              showIcon
              size="xs"
            >
              The server returned an error response.
            </AlertBanner>
          ) : null}
          <div className={styles.metadataGrid}>
            <MetadataField label="Status" value={getStatusLabel(request)} />
            <MetadataField
              label="Time"
              value={request.durationMs != null ? `${request.durationMs}ms` : "In progress"}
            />
          </div>
          <MetadataField
            label="Response data"
            value={
              request.status === "pending"
                ? "Waiting for response..."
                : request.responseBody || "No response body"
            }
            isCode
            copyValue={request.responseBody}
          />
        </div>
      )}
    </section>
  );

  const renderNetwork = () => (
    <div className={styles.networkPane}>
      {renderActivityList()}
      <div className={styles.networkDetails}>
        {selectedRequest ? (
          <div className={styles.detailCards}>
            {renderRequestCard(selectedRequest)}
            <div className={`${styles.connector} ${getConnectorStatusClass(selectedRequest)}`} aria-hidden />
            {renderResponseCard(selectedRequest)}
          </div>
        ) : (
          <EmptyState
            iconName="globe"
            title="No network activity"
            description="Network request details will appear here when your app makes API calls."
          />
        )}
      </div>
    </div>
  );

  return (
    <section
      className={styles.root}
      aria-label="Debug panel"
      style={{ height: `${height}px`, flexBasis: `${height}px` }}
    >
      {renderHeader()}
      {activeTab === "console" ? renderConsole() : renderNetwork()}
    </section>
  );
}
