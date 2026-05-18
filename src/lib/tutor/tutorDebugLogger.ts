type TutorLogLevel = "info" | "warn" | "error";

const TUTOR_LOG_PREFIX = "[TutorFlow]";

function isTutorDebugLoggingEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem("weblab:tutorDebugLogging") !== "off";
}

function normalizeDetail(detail: unknown) {
  if (detail instanceof Error) {
    return {
      name: detail.name,
      message: detail.message,
      stack: detail.stack,
    };
  }

  return detail;
}

export function logTutorEvent(
  event: string,
  detail?: unknown,
  level: TutorLogLevel = "info",
) {
  if (!isTutorDebugLoggingEnabled()) return;

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    detail: normalizeDetail(detail),
  };

  if (level === "error") {
    console.error(TUTOR_LOG_PREFIX, payload);
    return;
  }

  if (level === "warn") {
    console.warn(TUTOR_LOG_PREFIX, payload);
    return;
  }

  console.info(TUTOR_LOG_PREFIX, payload);
}
