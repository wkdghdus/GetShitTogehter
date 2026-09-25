import { createDailyEntry, createInitialAppState, createWeekReview } from "./defaults";
import { getLocalDate, getWeekStart } from "./dates";
import { arrangeDailyEntry } from "./timeline";
import type {
  AppSettings,
  AppState,
  CompletionState,
  CurriculumDayProgress,
  CurriculumProblemProgress,
  CurriculumTrackProgress,
  CurriculumUserProblem,
  DailyEntry,
  EnergyMode,
  LeetcodeCurriculumProgress,
  ProblemAttempt,
  ProblemRating,
  SystemDesignCurriculumProgress,
  TaskStatus,
  TimelineItem,
  TimelineMode,
  TimelinePreset,
  WorkTask,
} from "./types";

export const APP_STATE_STORAGE_KEY = "personal-routine-dashboard:v1";

type StateUpdater = (state: AppState) => AppState;

function nowIso(): string {
  return new Date().toISOString();
}

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordsHave(value: unknown, requiredStrings: string[], requiredArrays: string[] = []): boolean {
  return Array.isArray(value) && value.every((item) =>
    isRecord(item) &&
    requiredStrings.every((key) => typeof item[key] === "string") &&
    requiredArrays.every((key) => Array.isArray(item[key])),
  );
}

function isTimelineMode(value: unknown): value is TimelineMode {
  return value === "adaptive" || value === "normal" || value === "late-wake";
}

function isEnergyMode(value: unknown): value is EnergyMode {
  return value === "normal" || value === "low";
}

function isCompletionState(value: unknown): value is CompletionState {
  return value === "pending" || value === "completed" || value === "skipped";
}

function isTimeline(value: unknown): value is TimelineItem[] {
  return Array.isArray(value) && value.every((item) =>
    isRecord(item) &&
    typeof item.id === "string" &&
    typeof item.start === "string" &&
    typeof item.title === "string" &&
    typeof item.kind === "string",
  );
}

function isTimelinePreset(value: unknown): value is TimelinePreset {
  return isRecord(value) &&
    (value.id === "normal" || value.id === "late-wake") &&
    typeof value.name === "string" &&
    isTimeline(value.blocks);
}

// workTasks and the curriculum fields are intentionally absent below: every blob saved
// before they existed lacks them, and a check here would fail validation and make
// getAppState() overwrite real user data with defaults. They are validated tolerantly
// in mergeWithDefaults instead.
function isAppState(value: unknown): value is AppState {
  if (!isRecord(value)) return false;

  const settings = value.settings;
  const dailyEntries = value.dailyEntries;
  const weeklyReviews = value.weeklyReviews;

  if (!isRecord(settings) || !isRecord(settings.weeklyRoutine)) {
    return false;
  }

  const presets = settings.timelinePresets;
  const timelineSettingsAreValid =
    isTimeline(settings.timelineTemplate) ||
    (isRecord(presets) && isTimelinePreset(presets.normal) && isTimelinePreset(presets["late-wake"]));
  if (!timelineSettingsAreValid) return false;

  const routineIsValid = Object.values(settings.weeklyRoutine).every((day) =>
    isRecord(day) &&
    ["physicalType", "physicalLabel", "physicalStart", "physicalEnd", "focusCategory", "focusLabel", "focusObjective", "focusStart", "focusEnd"]
      .every((key) => typeof day[key] === "string"),
  );
  const dailyEntriesAreValid = isRecord(dailyEntries) && Object.values(dailyEntries).every((entry) =>
    isRecord(entry) &&
    typeof entry.date === "string" &&
    typeof entry.physicalLabel === "string" &&
    typeof entry.focusObjective === "string" &&
    typeof entry.physicalCompleted === "boolean" &&
    typeof entry.workCompleted === "boolean" &&
    typeof entry.focusCompleted === "boolean" &&
    Array.isArray(entry.lifeCheckIns) &&
    Array.isArray(entry.timeline),
  );
  const weeklyReviewsAreValid = isRecord(weeklyReviews) && Object.values(weeklyReviews).every((review) =>
    isRecord(review) &&
    typeof review.weekStart === "string" &&
    Array.isArray(review.priorities) &&
    review.priorities.length === 3 &&
    review.priorities.every((priority) =>
      isRecord(priority) && typeof priority.id === "string" && typeof priority.text === "string" && typeof priority.completed === "boolean"
    ),
  );

  return (
    value.version === 1 &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    routineIsValid &&
    dailyEntriesAreValid &&
    weeklyReviewsAreValid &&
    recordsHave(value.applications, ["id", "company", "role", "status"]) &&
    recordsHave(value.projects, ["id", "name", "nextAction", "status"], ["tasks"]) &&
    recordsHave(value.workoutTemplates, ["id", "name"], ["exercises"]) &&
    recordsHave(value.basketballSessions, ["id", "date", "type"]) &&
    recordsHave(value.leetcodeEntries, ["id", "problemName", "difficulty", "pattern", "status", "confidence"]) &&
    recordsHave(value.systemDesignEntries, ["id", "topic", "status", "confidence"]) &&
    recordsHave(value.schoolProjects, ["id", "projectName", "goal", "currentPhase"], ["teamMembers", "pmAttention", "tasks"]) &&
    recordsHave(value.adminInbox, ["id", "task", "status"]) &&
    recordsHave(value.mentalLoadInbox, ["id", "text", "capturedAt"]) &&
    recordsHave(value.focusSessions, ["id", "date", "objective"])
  );
}

const SYSTEM_DESIGN_TOTAL_DAYS = 28;
const LEETCODE_TOTAL_DAYS = 56;

function isProblemRating(value: unknown): value is ProblemRating {
  return value === "red" || value === "yellow" || value === "green";
}

function mergeCurrentDay(raw: unknown, fallback: number, totalDays: number): number {
  const coerced = Number(raw);
  if (!Number.isFinite(coerced)) return fallback;
  return Math.min(Math.max(Math.round(coerced), 1), totalDays);
}

function mergeDayProgress(
  raw: unknown,
  defaults: Record<string, CurriculumDayProgress>,
): Record<string, CurriculumDayProgress> {
  if (!isRecord(raw)) return defaults;

  const entries: Array<[string, CurriculumDayProgress]> = [];
  for (const [dayId, stored] of Object.entries(raw)) {
    if (!isRecord(stored)) continue;
    const day: CurriculumDayProgress = {};
    if (typeof stored.completedOn === "string") day.completedOn = stored.completedOn;
    if (typeof stored.note === "string") day.note = stored.note;
    entries.push([dayId, day]);
  }
  return Object.fromEntries(entries);
}

function mergeProblemProgress(
  raw: unknown,
  defaults: Record<string, CurriculumProblemProgress>,
): Record<string, CurriculumProblemProgress> {
  if (!isRecord(raw)) return defaults;

  const entries: Array<[string, CurriculumProblemProgress]> = [];
  for (const [slug, stored] of Object.entries(raw)) {
    if (!isRecord(stored)) continue;
    const attempts: ProblemAttempt[] = (Array.isArray(stored.attempts) ? stored.attempts : [])
      .filter((attempt): attempt is Record<string, unknown> => isRecord(attempt))
      .filter((attempt) => typeof attempt.date === "string" && isProblemRating(attempt.rating))
      .map((attempt) => ({ date: attempt.date as string, rating: attempt.rating as ProblemRating }));
    // A problem record exists because it was attempted, so an empty-attempts record is
    // meaningless — and dropping it here keeps it out of the review-scheduling engine.
    if (attempts.length === 0) continue;

    const problem: CurriculumProblemProgress = { slug, attempts };
    if (typeof stored.keyInsight === "string") problem.keyInsight = stored.keyInsight;
    entries.push([slug, problem]);
  }
  return Object.fromEntries(entries);
}

function mergeUserProblems(raw: unknown, defaults: CurriculumUserProblem[]): CurriculumUserProblem[] {
  if (!Array.isArray(raw)) return defaults;

  const problems: CurriculumUserProblem[] = [];
  for (const stored of raw) {
    if (!isRecord(stored)) continue;
    if (typeof stored.slug !== "string" || typeof stored.name !== "string" || typeof stored.addedOn !== "string") {
      continue;
    }
    const problem: CurriculumUserProblem = {
      slug: stored.slug,
      name: stored.name,
      addedOn: stored.addedOn,
    };
    if (typeof stored.pattern === "string") problem.pattern = stored.pattern;
    problems.push(problem);
  }
  return problems;
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "not-started" || value === "in-progress" || value === "blocked" || value === "complete";
}

function mergeWorkTasks(raw: unknown, defaults: WorkTask[]): WorkTask[] {
  if (!Array.isArray(raw)) return defaults;
  const tasks: WorkTask[] = [];
  for (const stored of raw) {
    if (!isRecord(stored)) continue;
    if (typeof stored.id !== "string" || typeof stored.title !== "string" || typeof stored.category !== "string") continue;
    if (!isTaskStatus(stored.status)) continue;
    const task: WorkTask = { id: stored.id, title: stored.title, category: stored.category, status: stored.status };
    if (typeof stored.detail === "string") task.detail = stored.detail;
    tasks.push(task);
  }
  return tasks;
}

function mergeTrackBase(
  raw: unknown,
  defaults: CurriculumTrackProgress,
  totalDays: number,
): Omit<CurriculumTrackProgress, "trackId"> {
  const stored = isRecord(raw) ? raw : {};
  const contentVersion = Number(stored.contentVersion);
  const base: Omit<CurriculumTrackProgress, "trackId"> = {
    contentVersion: Number.isFinite(contentVersion) ? contentVersion : defaults.contentVersion,
    currentDay: mergeCurrentDay(stored.currentDay, defaults.currentDay, totalDays),
    days: mergeDayProgress(stored.days, defaults.days),
  };
  const startedOn = typeof stored.startedOn === "string" ? stored.startedOn : defaults.startedOn;
  if (startedOn !== undefined) base.startedOn = startedOn;
  return base;
}

function mergeSystemDesignCurriculum(
  raw: unknown,
  defaults: SystemDesignCurriculumProgress,
): SystemDesignCurriculumProgress {
  return {
    ...mergeTrackBase(raw, defaults, SYSTEM_DESIGN_TOTAL_DAYS),
    trackId: "system-design",
  };
}

function mergeLeetcodeCurriculum(
  raw: unknown,
  defaults: LeetcodeCurriculumProgress,
): LeetcodeCurriculumProgress {
  const stored = isRecord(raw) ? raw : {};
  return {
    ...mergeTrackBase(raw, defaults, LEETCODE_TOTAL_DAYS),
    trackId: "leetcode",
    problems: mergeProblemProgress(stored.problems, defaults.problems),
    userProblems: mergeUserProblems(stored.userProblems, defaults.userProblems),
  };
}

function mergeWithDefaults(value: AppState): AppState {
  const defaults = createInitialAppState();
  const { timelineTemplate: legacyTimeline, ...storedSettings } = value.settings;
  const storedPresets: Record<string, unknown> = isRecord(value.settings.timelinePresets)
    ? value.settings.timelinePresets
    : {};
  const normalPreset = isTimelinePreset(storedPresets.normal) ? storedPresets.normal : undefined;
  const lateWakePreset = isTimelinePreset(storedPresets["late-wake"])
    ? storedPresets["late-wake"]
    : undefined;
  const settings: AppSettings = {
    ...defaults.settings,
    ...storedSettings,
    defaultTimelineMode: isTimelineMode(value.settings.defaultTimelineMode)
      ? value.settings.defaultTimelineMode
      : defaults.settings.defaultTimelineMode,
    weeklyRoutine: {
      ...defaults.settings.weeklyRoutine,
      ...value.settings.weeklyRoutine,
    },
    timelinePresets: {
      normal: {
        ...defaults.settings.timelinePresets.normal,
        ...normalPreset,
        id: "normal",
        blocks: normalPreset?.blocks ?? (isTimeline(legacyTimeline)
          ? legacyTimeline
          : defaults.settings.timelinePresets.normal.blocks),
      },
      "late-wake": {
        ...defaults.settings.timelinePresets["late-wake"],
        ...lateWakePreset,
        id: "late-wake",
        blocks: lateWakePreset?.blocks ?? defaults.settings.timelinePresets["late-wake"].blocks,
      },
    },
  };
  const dailyEntries = Object.fromEntries(
    Object.entries(value.dailyEntries).map(([date, entry]) => {
      const { lowEnergyMode, ...storedEntry } = entry as DailyEntry & { lowEnergyMode?: boolean };
      // Pre-migration data lacks these fields entirely; an already-migrated entry always has them.
      const isLegacyShape =
        !isTimelineMode(entry.timelineMode) ||
        !isCompletionState(entry.physicalStatus) ||
        !isCompletionState(entry.workStatus) ||
        !isCompletionState(entry.focusStatus);
      const timelineMode = isTimelineMode(entry.timelineMode) ? entry.timelineMode : settings.defaultTimelineMode;
      const energyMode = isEnergyMode(entry.energyMode) ? entry.energyMode : lowEnergyMode ? "low" : "normal";
      const migratedEntry = {
        ...storedEntry,
        timelineMode,
        energyMode,
        physicalStatus: isCompletionState(entry.physicalStatus)
          ? entry.physicalStatus
          : entry.physicalCompleted ? "completed" : "pending",
        workStatus: isCompletionState(entry.workStatus)
          ? entry.workStatus
          : entry.workCompleted ? "completed" : "pending",
        focusStatus: isCompletionState(entry.focusStatus)
          ? entry.focusStatus
          : entry.focusCompleted ? "completed" : "pending",
        decompressionStatus: isCompletionState(entry.decompressionStatus)
          ? entry.decompressionStatus
          : "pending",
      } satisfies DailyEntry;

      // Only genuinely legacy entries need a generated schedule backfilled here. An
      // already-migrated entry keeps whatever timeline it last had (created once, or last
      // set by an explicit Adapt Plan click) — adaptive planning must not re-derive it on
      // every read.
      if (!isLegacyShape) return [date, migratedEntry];
      return [date, arrangeDailyEntry(migratedEntry, timelineMode, energyMode, settings)];
    }),
  );

  return {
    ...defaults,
    ...value,
    settings,
    dailyEntries,
    weeklyReviews: {
      ...value.weeklyReviews,
    },
    systemDesignCurriculum: mergeSystemDesignCurriculum(value.systemDesignCurriculum, defaults.systemDesignCurriculum),
    leetcodeCurriculum: mergeLeetcodeCurriculum(value.leetcodeCurriculum, defaults.leetcodeCurriculum),
    workTasks: mergeWorkTasks(value.workTasks, defaults.workTasks),
    updatedAt: value.updatedAt || nowIso(),
  };
}

export function ensureDailyEntry(state: AppState, date = getLocalDate()): AppState {
  if (state.dailyEntries[date]) return state;

  return {
    ...state,
    updatedAt: nowIso(),
    dailyEntries: {
      ...state.dailyEntries,
      [date]: createDailyEntry(date, state.settings),
    },
  };
}

export function ensureWeekReview(state: AppState, date = getLocalDate()): AppState {
  const weekStart = getWeekStart(date);
  if (state.weeklyReviews[weekStart]) return state;

  return {
    ...state,
    updatedAt: nowIso(),
    weeklyReviews: {
      ...state.weeklyReviews,
      [weekStart]: createWeekReview(weekStart),
    },
  };
}

export function hydrateAppState(date = getLocalDate()): AppState {
  let state = getAppState();
  state = ensureDailyEntry(state, date);
  state = ensureWeekReview(state, date);
  saveAppState(state);
  return state;
}

export function getAppState(): AppState {
  if (!hasLocalStorage()) {
    return createInitialAppState();
  }

  const stored = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
  if (!stored) {
    const initial = createInitialAppState();
    saveAppState(initial);
    return initial;
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!isAppState(parsed)) {
      throw new Error("Stored routine data does not match the expected shape.");
    }

    return mergeWithDefaults(parsed);
  } catch {
    const fallback = createInitialAppState();
    saveAppState(fallback);
    return fallback;
  }
}

export function saveAppState(state: AppState): AppState {
  const nextState = {
    ...state,
    updatedAt: nowIso(),
  };

  if (hasLocalStorage()) {
    window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(nextState));
  }

  return nextState;
}

export function updateAppState(updater: StateUpdater): AppState {
  const current = hydrateAppState();
  const next = updater(current);
  return saveAppState(next);
}

export function updateDailyEntry(date: string, updater: (entry: DailyEntry) => DailyEntry): AppState {
  return updateAppState((state) => {
    const stateWithEntry = ensureDailyEntry(state, date);
    const current = stateWithEntry.dailyEntries[date];

    return {
      ...stateWithEntry,
      dailyEntries: {
        ...stateWithEntry.dailyEntries,
        [date]: updater(current),
      },
    };
  });
}

export function exportAppState(state: AppState = getAppState()): string {
  return JSON.stringify(state, null, 2);
}

export function importAppState(json: string): AppState {
  const parsed: unknown = JSON.parse(json);
  if (!isAppState(parsed)) {
    throw new Error("Imported file is not a valid routine dashboard export.");
  }

  return saveAppState(ensureDailyEntry(ensureWeekReview(mergeWithDefaults(parsed))));
}

export function resetAppState(): AppState {
  const initial = createInitialAppState();
  return saveAppState(initial);
}

export function clearStoredAppState(): void {
  if (hasLocalStorage()) {
    window.localStorage.removeItem(APP_STATE_STORAGE_KEY);
  }
}
