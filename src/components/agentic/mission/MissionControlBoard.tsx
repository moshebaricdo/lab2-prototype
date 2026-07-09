import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  AgentSpecialist,
  BriefcaseItem,
  MissionConfig,
  MissionTask,
  MissionTaskStatus,
} from "../../../types/agentLab";
import type { MissionTaskScript } from "../../../data/agentic";
import { AppButton } from "../../ui/AppButton";
import { AppNativeSelect } from "../../ui/AppDropdown";
import { FaIcon } from "../../ui/icons/FaIcon";
import type { FaIconName } from "../../../icons/faProRegularCodepoints";
import styles from "./MissionControlBoard.module.scss";

type RunOutcome = "success" | "starved" | "overloaded" | "wrong-specialist";

interface TaskRuntime {
  specialistId: string;
  packedPaths: string[];
  status: MissionTaskStatus;
  outcome?: RunOutcome;
  runCount: number;
}

interface MissionControlBoardProps {
  mission: MissionConfig;
  scripts: MissionTaskScript[];
  /** Notified when every task is approved, so the page can flip Continue state. */
  onMissionComplete?: () => void;
}

const STATUS_META: Record<
  MissionTaskStatus,
  { label: string; icon: FaIconName; tone: "idle" | "busy" | "good" | "warn" }
> = {
  "needs-setup": { label: "Pack the briefcase", icon: "box-open", tone: "idle" },
  ready: { label: "Ready to launch", icon: "rocket", tone: "idle" },
  queued: { label: "Queued", icon: "hourglass-half", tone: "busy" },
  reading: { label: "Reading briefcase…", icon: "box-open", tone: "busy" },
  working: { label: "Working…", icon: "spinner", tone: "busy" },
  "proposal-ready": { label: "Proposal ready", icon: "circle-check", tone: "good" },
  "needs-rework": { label: "Needs rework", icon: "circle-xmark", tone: "warn" },
  approved: { label: "Approved", icon: "flag-checkered", tone: "good" },
};

function sumTokens(items: BriefcaseItem[], packed: string[]): number {
  return items
    .filter((item) => packed.includes(item.path))
    .reduce((total, item) => total + item.contextTokens, 0);
}

function packLoadLabel(
  tokens: number,
  budget: MissionTask["contextBudget"],
): { label: string; tone: "starved" | "focused" | "overloaded" } {
  if (tokens < budget.min) return { label: "Looking light", tone: "starved" };
  if (tokens > budget.max) return { label: "Heavy pack", tone: "overloaded" };
  return { label: "Focused", tone: "focused" };
}

export function MissionControlBoard({
  mission,
  scripts,
  onMissionComplete,
}: MissionControlBoardProps) {
  const [runtimes, setRuntimes] = useState<Record<string, TaskRuntime>>(() =>
    Object.fromEntries(
      mission.tasks.map((task) => [
        task.id,
        {
          specialistId: task.suggestedSpecialistId,
          packedPaths: [],
          status: "needs-setup" as MissionTaskStatus,
          runCount: 0,
        },
      ]),
    ),
  );
  const [hasLaunched, setHasLaunched] = useState(false);
  const timersRef = useRef<number[]>([]);
  const completeNotifiedRef = useRef(false);
  const runtimesRef = useRef(runtimes);
  runtimesRef.current = runtimes;

  const specialistById = useMemo(() => {
    const map = new Map<string, AgentSpecialist>();
    mission.specialists.forEach((s) => map.set(s.id, s));
    return map;
  }, [mission.specialists]);

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const allApproved = mission.tasks.every(
    (task) => runtimes[task.id]?.status === "approved",
  );
  useEffect(() => {
    if (allApproved && !completeNotifiedRef.current) {
      completeNotifiedRef.current = true;
      onMissionComplete?.();
    }
  }, [allApproved, onMissionComplete]);

  const updateRuntime = useCallback(
    (taskId: string, patch: Partial<TaskRuntime>) => {
      setRuntimes((prev) => ({
        ...prev,
        [taskId]: { ...prev[taskId], ...patch },
      }));
    },
    [],
  );

  const togglePacked = useCallback(
    (task: MissionTask, path: string) => {
      setRuntimes((prev) => {
        const runtime = prev[task.id];
        if (
          ["queued", "reading", "working", "approved"].includes(runtime.status)
        ) {
          return prev;
        }
        const packed = runtime.packedPaths.includes(path)
          ? runtime.packedPaths.filter((p) => p !== path)
          : [...runtime.packedPaths, path];
        const status: MissionTaskStatus =
          packed.length > 0
            ? runtime.status === "needs-setup" || runtime.status === "ready"
              ? "ready"
              : runtime.status
            : "needs-setup";
        return {
          ...prev,
          [task.id]: { ...runtime, packedPaths: packed, status },
        };
      });
    },
    [],
  );

  const runTask = useCallback(
    (task: MissionTask, stagger = 0) => {
      const script = scripts.find((s) => s.taskId === task.id);
      const runtime = runtimesRef.current[task.id];
      if (!script || !runtime) return;

      const tokens = sumTokens(mission.briefcaseItems, runtime.packedPaths);
      const missing = task.requiredPaths.filter(
        (path) => !runtime.packedPaths.includes(path),
      );
      let outcome: RunOutcome;
      if (missing.length > 0) outcome = "starved";
      else if (runtime.specialistId !== task.suggestedSpecialistId) {
        outcome = "wrong-specialist";
      } else if (tokens > task.contextBudget.max) outcome = "overloaded";
      else outcome = "success";

      const workMs =
        script.workMs + (outcome === "overloaded" ? script.overloadedExtraMs : 0);

      const schedule = (delay: number, fn: () => void) => {
        const timer = window.setTimeout(fn, delay);
        timersRef.current.push(timer);
      };

      updateRuntime(task.id, {
        status: "queued",
        outcome: undefined,
        runCount: runtime.runCount + 1,
      });
      schedule(400 + stagger, () =>
        updateRuntime(task.id, { status: "reading" }),
      );
      schedule(1400 + stagger, () =>
        updateRuntime(task.id, { status: "working" }),
      );
      schedule(1400 + stagger + workMs, () =>
        updateRuntime(task.id, {
          status: outcome === "success" ? "proposal-ready" : "needs-rework",
          outcome,
        }),
      );
    },
    [scripts, mission.briefcaseItems, updateRuntime],
  );

  const launchAll = useCallback(() => {
    setHasLaunched(true);
    mission.tasks.forEach((task, index) => {
      const runtime = runtimes[task.id];
      if (runtime.status === "ready") runTask(task, index * 700);
    });
  }, [mission.tasks, runtimes, runTask]);

  const launchableCount = mission.tasks.filter(
    (task) => runtimes[task.id]?.status === "ready",
  ).length;

  const renderOutcomeCard = (task: MissionTask, runtime: TaskRuntime) => {
    const script = scripts.find((s) => s.taskId === task.id);
    if (!script || !runtime.outcome) return null;

    if (runtime.outcome === "wrong-specialist") {
      const suggested = specialistById.get(task.suggestedSpecialistId);
      const assigned = specialistById.get(runtime.specialistId);
      return (
        <div className={`${styles.outcomeCard} ${styles.outcomeWarn}`}>
          <span className={styles.outcomeHeadline}>
            Wrong specialty for this task
          </span>
          <p className={styles.outcomeSummary}>
            The {assigned?.role ?? "assigned agent"} attempted it, but this
            task fits the {suggested?.role ?? "right specialist"} — that agent
            has the right context and the right tools. Reassign and re-run.
          </p>
        </div>
      );
    }

    const outcomeScript = script[runtime.outcome];
    const missing = task.requiredPaths.filter(
      (path) => !runtime.packedPaths.includes(path),
    );
    const missingLabels = missing
      .map(
        (path) =>
          mission.briefcaseItems.find((item) => item.path === path)?.label ??
          path,
      )
      .join(" and ");
    const summary = outcomeScript.summary.replace(
      "{missing}",
      `**${missingLabels}**`,
    );
    return (
      <div
        className={`${styles.outcomeCard} ${
          runtime.outcome === "success" ? styles.outcomeGood : styles.outcomeWarn
        }`}
      >
        <span className={styles.outcomeHeadline}>{outcomeScript.headline}</span>
        <div className={styles.outcomeSummary}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
        </div>
        <ul className={styles.outcomeBullets}>
          {outcomeScript.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.scroller}>
        <header className={styles.missionHeader}>
          <div className={styles.missionIntro}>
            <h1 className={styles.missionTitle}>
              <FaIcon name="rocket" size="m" /> {mission.title}
            </h1>
            <div className={styles.missionBrief}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {mission.briefMarkdown}
              </ReactMarkdown>
            </div>
          </div>
          <div className={styles.missionActions}>
            <AppButton
              variant="primary"
              tone="purple"
              size="m"
              iconName="rocket"
              disabled={launchableCount === 0}
              onClick={launchAll}
            >
              {hasLaunched
                ? `Re-launch ready tasks (${launchableCount})`
                : `Launch run (${launchableCount} of ${mission.tasks.length} ready)`}
            </AppButton>
            <span className={styles.missionHint}>
              Agents run in parallel and never see each other&apos;s chat —
              only the files you pack.
            </span>
          </div>
        </header>

        {allApproved && (
          <div className={styles.debrief}>
            <span className={styles.debriefTitle}>
              <FaIcon name="flag-checkered" size="s" /> Mission complete
            </span>
            <p>
              You just did the three jobs of an agent orchestrator: you{" "}
              <strong>scoped context</strong> (the briefcases),{" "}
              <strong>delegated to specialists</strong>, and{" "}
              <strong>verified every result before it shipped</strong>. No
              agent saw the whole project — and the work still got done.
            </p>
          </div>
        )}

        <div className={styles.taskGrid}>
          {mission.tasks.map((task) => {
            const runtime = runtimes[task.id];
            const specialist = specialistById.get(runtime.specialistId);
            const tokens = sumTokens(mission.briefcaseItems, runtime.packedPaths);
            const load = packLoadLabel(tokens, task.contextBudget);
            const meterPercent = Math.min(
              100,
              Math.round((tokens / (task.contextBudget.max * 1.3)) * 100),
            );
            const statusMeta = STATUS_META[runtime.status];
            const isRunning = ["queued", "reading", "working"].includes(
              runtime.status,
            );
            const isEditable = !isRunning && runtime.status !== "approved";

            return (
              <section key={task.id} className={styles.taskCard}>
                <header className={styles.taskHeader}>
                  <h2 className={styles.taskTitle}>{task.title}</h2>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[
                        `statusTone${statusMeta.tone
                          .charAt(0)
                          .toUpperCase()}${statusMeta.tone.slice(1)}`
                      ]
                    }`}
                  >
                    <FaIcon
                      name={statusMeta.icon}
                      size="xs"
                      className={
                        runtime.status === "working" ? styles.spin : undefined
                      }
                    />
                    {statusMeta.label}
                  </span>
                </header>
                <p className={styles.taskBrief}>{task.brief}</p>

                <label className={styles.fieldLabel}>
                  Assigned specialist
                  <AppNativeSelect
                    className={styles.specialistSelect}
                    size="s"
                    tone="gray"
                    fullWidth
                    value={runtime.specialistId}
                    disabled={!isEditable}
                    onValueChange={(value) =>
                      updateRuntime(task.id, { specialistId: value })
                    }
                    options={mission.specialists.map((s) => ({
                      value: s.id,
                      label: s.role,
                    }))}
                  />
                </label>
                {specialist && (
                  <span className={styles.specialistNote}>
                    {specialist.tagline}
                  </span>
                )}

                <div className={styles.briefcase}>
                  <span className={styles.fieldLabel}>
                    <FaIcon name="briefcase" size="xs" /> Briefcase — what this
                    agent gets to see
                  </span>
                  <div className={styles.briefcaseItems}>
                    {mission.briefcaseItems.map((item) => {
                      const packed = runtime.packedPaths.includes(item.path);
                      return (
                        <label
                          key={item.path}
                          className={`${styles.briefcaseItem} ${
                            packed ? styles.briefcaseItemPacked : ""
                          } ${!isEditable ? styles.briefcaseItemLocked : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={packed}
                            disabled={!isEditable}
                            onChange={() => togglePacked(task, item.path)}
                          />
                          <span className={styles.briefcaseItemLabel}>
                            {item.label}
                          </span>
                          <span className={styles.briefcaseItemTokens}>
                            ~{item.contextTokens} tok
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div className={styles.meterRow}>
                    <div className={styles.meterTrack}>
                      <div
                        className={`${styles.meterFill} ${
                          styles[
                            `meterFill${load.tone
                              .charAt(0)
                              .toUpperCase()}${load.tone.slice(1)}`
                          ]
                        }`}
                        style={{ width: `${meterPercent}%` }}
                      />
                      <span
                        className={styles.meterBudgetMark}
                        style={{
                          left: `${Math.round(
                            (task.contextBudget.max /
                              (task.contextBudget.max * 1.3)) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`${styles.meterLabel} ${
                        styles[
                          `meterLabel${load.tone
                            .charAt(0)
                            .toUpperCase()}${load.tone.slice(1)}`
                        ]
                      }`}
                    >
                      {tokens === 0 ? "Empty briefcase" : `${load.label} · ~${tokens} tok`}
                    </span>
                  </div>
                </div>

                {runtime.outcome &&
                  !isRunning &&
                  renderOutcomeCard(task, runtime)}

                <div className={styles.taskActions}>
                  {runtime.status === "proposal-ready" && (
                    <>
                      <AppButton
                        variant="primary"
                        tone="purple"
                        size="xs"
                        iconName="check"
                        onClick={() =>
                          updateRuntime(task.id, { status: "approved" })
                        }
                      >
                        Approve
                      </AppButton>
                      <AppButton
                        variant="secondary"
                        tone="black"
                        size="xs"
                        iconName="arrows-rotate"
                        onClick={() => runTask(task)}
                      >
                        Send back &amp; re-run
                      </AppButton>
                    </>
                  )}
                  {runtime.status === "needs-rework" && (
                    <AppButton
                      variant="primary"
                      tone="purple"
                      size="xs"
                      iconName="arrows-rotate"
                      onClick={() => runTask(task)}
                    >
                      Fix briefcase &amp; re-run
                    </AppButton>
                  )}
                  {runtime.status === "ready" && hasLaunched && (
                    <AppButton
                      variant="secondary"
                      tone="black"
                      size="xs"
                      iconName="play"
                      onClick={() => runTask(task)}
                    >
                      Run this task
                    </AppButton>
                  )}
                  {runtime.status === "approved" && (
                    <span className={styles.approvedNote}>
                      <FaIcon name="circle-check" size="xs" /> Shipped after{" "}
                      {runtime.runCount} run{runtime.runCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <footer className={styles.boardFootnote}>
          Demo level — agent runs are scripted, but the outcomes are computed
          from your real packing choices. On integration each run becomes a
          scoped Tutor call (see `src/guidelines/level-types/weblab2-agents.md`).
        </footer>
      </div>
    </div>
  );
}
