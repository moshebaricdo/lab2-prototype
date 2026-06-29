import { AppButton } from "../../../../ui/AppButton";
import { AlertBanner } from "../../../../ui/AlertBanner";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import { Tooltip } from "../../../../ui/Tooltip";
import { SegmentedControl, type SegmentedOption } from "../../../../ui/SegmentedControl";
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

type StepStatus = "success" | "failure" | "pending";

function getStepIconClass(status: StepStatus) {
  if (status === "success") return styles.stepIconSuccess;
  if (status === "pending") return styles.stepIconPending;
  return styles.stepIconFailure;
}

function getStepIconName(status: StepStatus) {
  if (status === "success") return "circle-check";
  if (status === "pending") return "spinner-third";
  return "circle-xmark";
}

function getActivityStepStatus(request: PreviewNetworkRequest): StepStatus {
  if (request.status === "success") return "success";
  if (request.status === "pending") return "pending";
  return "failure";
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

function getRequestStepStatus(request: PreviewNetworkRequest): StepStatus {
  if (request.status === "request-error") return "failure";
  if (request.status === "pending") return "pending";
  return "success";
}

function getResponseStepStatus(request: PreviewNetworkRequest): StepStatus {
  if (request.status === "success") return "success";
  if (request.status === "pending") return "pending";
  return "failure";
}

function isResponseDisabled(request: PreviewNetworkRequest) {
  return request.status === "request-error" || request.status === "response-error";
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
          {consoleMessages.map((message) => (
            <div
              key={message.id}
              className={styles.consoleRow}
            >
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
                className={styles.activityItem}
                aria-pressed={isSelected}
                onClick={() => onSelectNetworkRequest(request.id)}
              >
                <span className={`${styles.radio} ${isSelected ? styles.radioSelected : ""}`}>
                  {isSelected ? <span className={styles.radioDot} /> : null}
                </span>
                <span className={styles.activityName}>{getRequestName(request.url)}</span>
                <span className={`${styles.stepIcon} ${getStepIconClass(getActivityStepStatus(request))}`}>
                  <FaIcon name={getStepIconName(getActivityStepStatus(request))} size="s" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );

  const renderRequestCard = (request: PreviewNetworkRequest) => {
    const stepStatus = getRequestStepStatus(request);
    return (
      <section
        className={`${styles.detailCard} ${
          isResponseDisabled(request) ? styles.detailCardExpanded : ""
        }`}
      >
        <div className={styles.detailHeader}>
          <h3>Request</h3>
          <span className={`${styles.stepIcon} ${getStepIconClass(stepStatus)}`}>
            <FaIcon name={getStepIconName(stepStatus)} size="s" />
          </span>
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
  };

  const renderResponseCard = (request: PreviewNetworkRequest) => {
    const stepStatus = getResponseStepStatus(request);
    const isDisabled = isResponseDisabled(request);
    return (
      <section className={`${styles.detailCard} ${isDisabled ? styles.detailCardDisabled : ""}`}>
        <div className={styles.detailHeader}>
          <h3>Response</h3>
          <span className={`${styles.stepIcon} ${getStepIconClass(stepStatus)}`}>
            <FaIcon name={getStepIconName(stepStatus)} size="s" />
          </span>
        </div>
        {isDisabled ? null : (
          <div className={styles.detailBody}>
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
  };

  const renderNetwork = () => (
    <div className={styles.networkPane}>
      {renderActivityList()}
      <div className={styles.networkDetails}>
        {selectedRequest ? (
          <div
            className={`${styles.detailCards} ${
              isResponseDisabled(selectedRequest) ? styles.detailCardsResponseDisabled : ""
            }`}
          >
            {renderRequestCard(selectedRequest)}
            <div className={`${styles.connector} ${getConnectorStatusClass(selectedRequest)}`} aria-hidden>
              <span className={`${styles.connectorNode} ${styles.connectorNodeStart}`} />
              <span className={`${styles.connectorNode} ${styles.connectorNodeEnd}`} />
            </div>
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
