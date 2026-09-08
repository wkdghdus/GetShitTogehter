import { createDailyEntry, createInitialAppState, createWeekReview } from "./defaults";
import { getLocalDate, getWeekStart } from "./dates";
import type { AppState, DailyEntry } from "./types";

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

function isAppState(value: unknown): value is AppState {
  if (!isRecord(value)) return false;

  const settings = value.settings;
  const dailyEntries = value.dailyEntries;
  const weeklyReviews = value.weeklyReviews;

  if (!isRecord(settings) || !isRecord(settings.weeklyRoutine) || !Array.isArray(settings.timelineTemplate)) {
    return false;
  }

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

function mergeWithDefaults(value: AppState): AppState {
  const defaults = createInitialAppState();

  return {
    ...defaults,
    ...value,
    settings: {
      ...defaults.settings,
      ...value.settings,
      weeklyRoutine: {
        ...defaults.settings.weeklyRoutine,
        ...value.settings.weeklyRoutine,
      },
      timelineTemplate: Array.isArray(value.settings.timelineTemplate)
        ? value.settings.timelineTemplate
        : defaults.settings.timelineTemplate,
    },
    dailyEntries: {
      ...value.dailyEntries,
    },
    weeklyReviews: {
      ...value.weeklyReviews,
    },
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
