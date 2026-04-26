import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "weblab:tutor-api-key";
const CODE_MODEL_STORAGE_KEY = "weblab:tutor-code-model";
export const DEFAULT_TUTOR_CODE_MODEL = "gpt-4.1";
export const TUTOR_CODE_MODEL_OPTIONS = [
  { label: "GPT-4.1", value: "gpt-4.1" },
  { label: "GPT-4.1 mini", value: "gpt-4.1-mini" },
  { label: "GPT-4.1 nano", value: "gpt-4.1-nano" },
];

function normalizeTutorCodeModel(value: string | null) {
  const normalized = value?.trim() || DEFAULT_TUTOR_CODE_MODEL;
  return TUTOR_CODE_MODEL_OPTIONS.some((option) => option.value === normalized)
    ? normalized
    : DEFAULT_TUTOR_CODE_MODEL;
}

export function getTutorApiKey() {
  return sessionStorage.getItem(STORAGE_KEY) ?? "";
}

export function getTutorCodeModel() {
  return normalizeTutorCodeModel(sessionStorage.getItem(CODE_MODEL_STORAGE_KEY));
}

export function useTutorApiSettings() {
  const [apiKey, setApiKeyState] = useState("");
  const [codeModel, setCodeModelState] = useState(DEFAULT_TUTOR_CODE_MODEL);

  useEffect(() => {
    setApiKeyState(getTutorApiKey());
    setCodeModelState(getTutorCodeModel());
  }, []);

  const setApiKey = (value: string) => {
    setApiKeyState(value);
    if (value.trim()) {
      sessionStorage.setItem(STORAGE_KEY, value);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const setCodeModel = (value: string) => {
    const normalized = normalizeTutorCodeModel(value);
    setCodeModelState(normalized);
    if (normalized !== DEFAULT_TUTOR_CODE_MODEL) {
      sessionStorage.setItem(CODE_MODEL_STORAGE_KEY, normalized);
    } else {
      sessionStorage.removeItem(CODE_MODEL_STORAGE_KEY);
    }
  };

  return useMemo(
    () => ({
      apiKey,
      setApiKey,
      hasApiKey: apiKey.trim().length > 0,
      codeModel,
      setCodeModel,
    }),
    [apiKey, codeModel],
  );
}
