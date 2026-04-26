import { useEffect, useMemo, useState } from "react";

const ADDITIONAL_PROMPT_STORAGE_KEY = "weblab:tutor-additional-prompt";

export function useTutorPromptSettings() {
  const [additionalTutorPrompt, setAdditionalTutorPromptState] = useState("");

  useEffect(() => {
    setAdditionalTutorPromptState(
      sessionStorage.getItem(ADDITIONAL_PROMPT_STORAGE_KEY) ?? "",
    );
  }, []);

  const setAdditionalTutorPrompt = (value: string) => {
    setAdditionalTutorPromptState(value);
    if (value.trim()) {
      sessionStorage.setItem(ADDITIONAL_PROMPT_STORAGE_KEY, value);
    } else {
      sessionStorage.removeItem(ADDITIONAL_PROMPT_STORAGE_KEY);
    }
  };

  const resetAdditionalTutorPrompt = () => {
    setAdditionalTutorPrompt("");
  };

  return useMemo(
    () => ({
      additionalTutorPrompt,
      setAdditionalTutorPrompt,
      resetAdditionalTutorPrompt,
    }),
    [additionalTutorPrompt],
  );
}
