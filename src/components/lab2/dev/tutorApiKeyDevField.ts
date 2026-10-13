import type { DevPanelField } from "./types";
import { TUTOR_API_KEY_DEV_FIELD_KEY } from "../../../hooks/useTutorApiSettings";

/** Session tutor key. Writes through useTutorApiSettings, not the URL. */
export const tutorApiKeyDevField: DevPanelField = {
  key: TUTOR_API_KEY_DEV_FIELD_KEY,
  label: "Tutor API key",
  description: "Stored for this browser session. Used by prototype tutor calls.",
  type: "text",
  sensitive: true,
  storage: "session",
  group: "AI Tutor",
};
