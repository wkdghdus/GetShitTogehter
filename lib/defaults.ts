import { getLocalDate, getWeekStart, getWeekday } from "./dates";
import { CONTENT_VERSION as LEETCODE_CONTENT_VERSION } from "./curricula/leetcode";
import { arrangeDailyEntry } from "./timeline";
import { CONTENT_VERSION as SYSTEM_DESIGN_CONTENT_VERSION } from "./curricula/system-design";
import type {
  AppSettings,
  AppState,
  DailyEntry,
  LeetcodeCurriculumProgress,
  SystemDesignCurriculumProgress,
  TimelineItem,
  TimelinePreset,
  WeekReview,
  WeeklyPriority,
  Weekday,
} from "./types";

export const DEFAULT_NORMAL_TIMELINE: TimelineItem[] = [
  { id: "wake", start: "06:15", title: "Wake up", kind: "anchor" },
  {
    id: "morning-prep",
    start: "06:15",
    end: "06:30",
    title: "Water, bathroom, light preparation",
    kind: "anchor",
  },
  { id: "physical", start: "06:30", end: "07:30", title: "Physical activity", kind: "physical" },
  { id: "shower", start: "07:30", end: "07:50", title: "Shower", kind: "anchor" },
  { id: "breakfast", start: "07:50", end: "08:15", title: "Breakfast + prepare", kind: "meal" },
  { id: "work", start: "09:00", end: "17:00", title: "Work", kind: "work" },
  { id: "decompression", start: "17:30", end: "18:00", title: "Decompression", kind: "decompression" },
  { id: "dinner", start: "18:00", end: "18:45", title: "Dinner / family", kind: "meal" },
  { id: "focus", start: "18:45", end: "20:15", title: "Main focus block", kind: "focus" },
  { id: "free-life", start: "20:15", end: "22:15", title: "Free life", kind: "life" },
  { id: "shutdown", start: "22:15", end: "22:45", title: "Prepare tomorrow", kind: "shutdown" },
  { id: "wind-down", start: "22:45", end: "23:00", title: "Quiet wind-down", kind: "shutdown" },
  { id: "sleep", start: "23:00", title: "Sleep", kind: "sleep" },
];

export const DEFAULT_LATE_WAKE_TIMELINE: TimelineItem[] = [
  { id: "wake", start: "07:30", title: "Wake up", kind: "anchor" },
  {
    id: "morning-prep",
    start: "07:30",
    end: "08:15",
    title: "Bathroom, breakfast, get ready",
    kind: "anchor",
  },
  { id: "work", start: "09:00", end: "17:00", title: "Work", kind: "work" },
  {
    id: "decompression",
    start: "17:30",
    end: "18:00",
    title: "Protected decompression",
    kind: "decompression",
  },
  { id: "physical", start: "18:00", end: "19:00", title: "Physical activity", kind: "physical" },
  { id: "dinner", start: "19:00", end: "19:45", title: "Shower + dinner", kind: "meal" },
  { id: "focus", start: "19:45", end: "21:15", title: "Main focus block", kind: "focus" },
  { id: "free-life", start: "21:15", end: "22:30", title: "Free life", kind: "life" },
  {
    id: "shutdown",
    start: "22:30",
    end: "23:00",
    title: "Prepare tomorrow + wind-down",
    kind: "shutdown",
  },
  { id: "quiet-time", start: "23:00", end: "23:30", title: "Quiet personal time", kind: "life" },
  { id: "sleep", start: "23:30", title: "Sleep", kind: "sleep" },
];

export const DEFAULT_TIMELINE_PRESETS: Record<"normal" | "late-wake", TimelinePreset> = {
  normal: {
    id: "normal",
    name: "Normal Day",
    blocks: DEFAULT_NORMAL_TIMELINE,
  },
  "late-wake": {
    id: "late-wake",
    name: "Late Wake Day",
    blocks: DEFAULT_LATE_WAKE_TIMELINE,
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  wakeTime: "06:15",
  bedtime: "23:00",
  workStart: "09:00",
  workEnd: "17:00",
  commuteHomeTime: "17:30",
  decompressionDurationMinutes: 30,
  focusBlockStart: "18:45",
  focusBlockEnd: "20:15",
  freeLifeStart: "20:15",
  freeLifeEnd: "22:15",
  weeklyApplicationTarget: 10,
  defaultTimelineMode: "adaptive",
  maximumAutomaticBedtimeDelayMinutes: 0,
  weeklyRoutine: {
    monday: {
      physicalType: "gym",
      physicalLabel: "Gym",
      physicalStart: "06:30",
      physicalEnd: "07:30",
      focusCategory: "leetcode",
      focusLabel: "Leetcode",
      focusObjective: "Practice one interview problem with clear explanation.",
      focusNextAction: "Review one interview problem.",
      focusStart: "18:45",
      focusEnd: "20:15",
    },
    tuesday: {
      physicalType: "basketball",
      physicalLabel: "Basketball",
      physicalStart: "06:30",
      physicalEnd: "07:30",
      focusCategory: "project",
      focusLabel: "GitHub / AI Project",
      focusObjective: "Ship one meaningful project improvement.",
      focusNextAction: "Complete the next project task.",
      focusStart: "18:45",
      focusEnd: "20:15",
    },
    wednesday: {
      physicalType: "recovery",
      physicalLabel: "Recovery",
      physicalStart: "06:30",
      physicalEnd: "07:30",
      focusCategory: "system-design",
      focusLabel: "System Design",
      focusObjective: "Study one architecture topic or practice case.",
      focusNextAction: "Review one system design concept.",
      focusStart: "18:45",
      focusEnd: "20:15",
    },
    thursday: {
      physicalType: "gym",
      physicalLabel: "Gym",
      physicalStart: "06:30",
      physicalEnd: "07:30",
      focusCategory: "applications",
      focusLabel: "Internship Applications",
      focusObjective: "Submit or improve quality internship applications.",
      focusNextAction: "Submit or improve one saved application.",
      focusStart: "18:45",
      focusEnd: "20:15",
    },
    friday: {
      physicalType: "basketball",
      physicalLabel: "Basketball",
      physicalStart: "06:30",
      physicalEnd: "07:30",
      focusCategory: "admin",
      focusLabel: "Admin / Catch-up",
      focusObjective: "Clear one administrative item or catch-up task.",
      focusNextAction: "Clear one administrative item.",
      focusStart: "18:45",
      focusEnd: "20:15",
    },
    saturday: {
      physicalType: "flexible",
      physicalLabel: "Flexible Basketball / Gym",
      physicalStart: "06:30",
      physicalEnd: "07:30",
      focusCategory: "project",
      focusLabel: "Project + Applications",
      focusObjective: "Move a project forward and check application pipeline.",
      focusNextAction: "Complete one project or application pipeline action.",
      focusStart: "18:45",
      focusEnd: "20:15",
    },
    sunday: {
      physicalType: "rest",
      physicalLabel: "Rest",
      physicalStart: "06:30",
      physicalEnd: "07:30",
      focusCategory: "school",
      focusLabel: "School PM + Weekly Review",
      focusObjective: "Review the week and plan the school PM priority.",
      focusNextAction: "Send one PM follow-up or write the weekly review.",
      focusStart: "18:45",
      focusEnd: "20:15",
    },
  },
  timelinePresets: DEFAULT_TIMELINE_PRESETS,
};

export function createId(prefix = "item"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createWeeklyPriority(index: number): WeeklyPriority {
  return {
    id: createId(`weekly-priority-${index}`),
    text: "",
    completed: false,
  };
}

export function createWeekReview(weekStart: string = getWeekStart()): WeekReview {
  return {
    weekStart,
    priorities: [createWeeklyPriority(1), createWeeklyPriority(2), createWeeklyPriority(3)],
    wentWell: "",
    friction: "",
    avoided: "",
    changeNextWeek: "",
  };
}

export function createDailyEntry(date: string = getLocalDate(), settings: AppSettings = DEFAULT_SETTINGS): DailyEntry {
  const weekday = getWeekday(date);
  const routine = settings.weeklyRoutine[weekday];
  const timelineMode = settings.defaultTimelineMode;

  const entry: DailyEntry = {
    date,
    weekday,
    timelineMode,
    energyMode: "normal",
    physicalType: routine.physicalType,
    physicalLabel: routine.physicalLabel,
    physicalStart: routine.physicalStart,
    physicalEnd: routine.physicalEnd,
    physicalCompleted: false,
    physicalStatus: "pending",
    workCompleted: weekday === "saturday" || weekday === "sunday",
    workStatus: weekday === "saturday" || weekday === "sunday" ? "completed" : "pending",
    focusCategory: routine.focusCategory,
    focusLabel: routine.focusLabel,
    focusObjective: routine.focusObjective,
    focusNextAction: routine.focusNextAction ?? routine.focusObjective,
    focusStart: routine.focusStart,
    focusEnd: routine.focusEnd,
    focusCompleted: false,
    focusStatus: "pending",
    decompressionStatus: "pending",
    lifeCheckIns: [],
    timeline: [],
  };

  return arrangeDailyEntry(entry, timelineMode, "normal", settings);
}

export function createSystemDesignCurriculum(): SystemDesignCurriculumProgress {
  return {
    trackId: "system-design",
    contentVersion: SYSTEM_DESIGN_CONTENT_VERSION,
    currentDay: 1,
    days: {},
  };
}

export function createLeetcodeCurriculum(): LeetcodeCurriculumProgress {
  return {
    trackId: "leetcode",
    contentVersion: LEETCODE_CONTENT_VERSION,
    currentDay: 1,
    days: {},
    problems: {},
    userProblems: [],
  };
}

export function createInitialAppState(now = new Date()): AppState {
  const today = getLocalDate(now);
  const weekStart = getWeekStart(today);
  const state: AppState = {
    version: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    settings: DEFAULT_SETTINGS,
    dailyEntries: {},
    weeklyReviews: {
      [weekStart]: createWeekReview(weekStart),
    },
    applications: [],
    projects: [
      {
        id: createId("project"),
        name: "Personal Routine Dashboard",
        description: "A calm local tool for keeping routine, career, school, admin, and recovery in balance.",
        milestone: "Launch usable local app",
        nextAction: "Finish the first working version.",
        status: "active",
        tasks: [],
      },
    ],
    workoutTemplates: [
      {
        id: createId("workout-template"),
        name: "Balanced Strength",
        exercises: [
          { id: createId("exercise"), exercise: "Bench Press", sets: "3", reps: "8" },
          { id: createId("exercise"), exercise: "Lat Pulldown", sets: "3", reps: "10" },
          { id: createId("exercise"), exercise: "Squat or Leg Press", sets: "3", reps: "8" },
          { id: createId("exercise"), exercise: "Shoulder Press", sets: "3", reps: "8" },
          { id: createId("exercise"), exercise: "Core", sets: "3", reps: "sets" },
        ],
      },
    ],
    basketballSessions: [],
    leetcodeEntries: [],
    systemDesignEntries: [],
    schoolProjects: [],
    adminInbox: [],
    mentalLoadInbox: [],
    focusSessions: [],
    systemDesignCurriculum: createSystemDesignCurriculum(),
    leetcodeCurriculum: createLeetcodeCurriculum(),
  };

  state.dailyEntries[today] = createDailyEntry(today, state.settings);
  return state;
}

export function orderedWeekdayEntries<T>(record: Record<Weekday, T>): Array<[Weekday, T]> {
  return (["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as Weekday[]).map(
    (day) => [day, record[day]],
  );
}
