import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resolveShareAwareNavigationPath } from "../lib/levelShareLinks";

export const LEVEL_SHARE_MODE_PARAM = "share";

export type LevelShareMode = "off" | "locked" | "flow";
export type ActiveLevelShareMode = Exclude<LevelShareMode, "off">;

export interface ShareFlowCompletionConfig {
  title?: string;
  message?: string;
  buttonLabel?: string;
}

export interface ShareModeConfig {
  mode: LevelShareMode;
  flowCompletion?: ShareFlowCompletionConfig;
}

export function getLevelShareModeSearchParams(
  searchParams: URLSearchParams,
): LevelShareMode {
  const value = searchParams.get(LEVEL_SHARE_MODE_PARAM);
  if (value === "flow") return "flow";
  if (value === "locked" || value === "1" || value === "true") return "locked";
  return "off";
}

export function isLevelShareModeSearchParams(searchParams: URLSearchParams) {
  return getLevelShareModeSearchParams(searchParams) !== "off";
}

export function addLevelShareModeSearchParam(
  searchParams: URLSearchParams,
  mode: ActiveLevelShareMode = "locked",
) {
  const next = new URLSearchParams(searchParams);
  next.set(LEVEL_SHARE_MODE_PARAM, mode);
  return next;
}

export function useLevelShareMode() {
  const [searchParams] = useSearchParams();
  return getLevelShareModeSearchParams(searchParams);
}

export function useShareAwareNavigate() {
  const navigate = useNavigate();
  const shareMode = useLevelShareMode();

  return useCallback(
    (path: string) => {
      navigate(resolveShareAwareNavigationPath(path, shareMode));
    },
    [navigate, shareMode],
  );
}
