export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type PhysicalType = "gym" | "basketball" | "recovery" | "rest" | "flexible";

export type FocusCategory =
  | "leetcode"
  | "system-design"
  | "project"
  | "applications"
  | "school"
  | "admin";

export type DailyStatus = "complete" | "solid" | "recovery" | "low-energy" | "rest";
export type TimelineMode = "adaptive" | "normal" | "late-wake";
export type EnergyMode = "normal" | "low";
export type CompletionState = "pending" | "completed" | "skipped";
export type AdaptiveScheduleStatus = "on-track" | "adjusted" | "compressed" | "minimal";
export type TaskStatus = "not-started" | "in-progress" | "blocked" | "complete";
export type ProjectStatus = "active" | "paused" | "complete";
export type ApplicationStatus =
  | "saved"
  | "applied"
  | "oa"
  | "recruiter-screen"
  | "technical-interview"
  | "final-interview"
  | "offer"
  | "rejected"
  | "withdrawn";
export type LeetcodeStatus = "new" | "solved" | "review";
export type Difficulty = "easy" | "medium" | "hard";
export type Confidence = "weak" | "developing" | "comfortable" | "strong";
export type BasketballSessionType =
  | "shooting"
  | "ball-handling"
  | "finishing"
  | "footwork"
  | "pickup"
  | "mixed-practice";
export type MentalLoadArea =
  | "career"
  | "applications"
  | "project"
  | "school"
  | "admin"
  | "personal";

export interface TimelineItem {
  id: string;
  start: string;
  end?: string;
  title: string;
  description?: string;
  state?: CompletionState;
  locked?: boolean;
  generated?: boolean;
  compressed?: boolean;
  minimumViable?: boolean;
  kind:
    | "anchor"
    | "physical"
    | "work"
    | "decompression"
    | "meal"
    | "focus"
    | "life"
    | "shutdown"
    | "sleep"
    | "custom";
}

export interface TimelinePreset {
  id: Exclude<TimelineMode, "adaptive">;
  name: string;
  blocks: TimelineItem[];
}

export interface WeeklyRoutineDay {
  physicalType: PhysicalType;
  physicalLabel: string;
  physicalStart: string;
  physicalEnd: string;
  focusCategory: FocusCategory;
  focusLabel: string;
  focusObjective: string;
  focusNextAction?: string;
  focusStart: string;
  focusEnd: string;
}

export interface AppSettings {
  wakeTime: string;
  bedtime: string;
  workStart: string;
  workEnd: string;
  commuteHomeTime: string;
  decompressionDurationMinutes: number;
  focusBlockStart: string;
  focusBlockEnd: string;
  freeLifeStart: string;
  freeLifeEnd: string;
  weeklyApplicationTarget: number;
  defaultTimelineMode: TimelineMode;
  weeklyRoutine: Record<Weekday, WeeklyRoutineDay>;
  maximumAutomaticBedtimeDelayMinutes: number;
  timelinePresets: Record<Exclude<TimelineMode, "adaptive">, TimelinePreset>;
  /** Kept only so version 1 localStorage exports can be migrated safely. */
  timelineTemplate?: TimelineItem[];
}

export interface DailyEntry {
  date: string;
  weekday: Weekday;
  timelineMode: TimelineMode;
  energyMode: EnergyMode;
  physicalType: PhysicalType;
  physicalLabel: string;
  physicalStart: string;
  physicalEnd: string;
  physicalCompleted: boolean;
  physicalStatus: CompletionState;
  workCompleted: boolean;
  workStatus: CompletionState;
  focusCategory: FocusCategory;
  focusLabel: string;
  focusObjective: string;
  focusNextAction?: string;
  focusStart: string;
  focusEnd: string;
  focusCompleted: boolean;
  focusStatus: CompletionState;
  decompressionStatus: CompletionState;
  focusNote?: string;
  lowEnergyChoice?: string;
  shutdownDone?: string;
  shutdownCompletedAt?: string;
  tomorrowPriority?: string;
  generatedStatus?: AdaptiveScheduleStatus;
  generatedMessage?: string;
  pendingCore?: string[];
  lifeCheckIns: string[];
  timeline: TimelineItem[];
}

export interface WeeklyPriority {
  id: string;
  text: string;
  completed: boolean;
}

export interface WeekReview {
  weekStart: string;
  priorities: [WeeklyPriority, WeeklyPriority, WeeklyPriority];
  wentWell: string;
  friction: string;
  avoided: string;
  changeNextWeek: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  location?: string;
  url?: string;
  dateApplied?: string;
  status: ApplicationStatus;
  referral?: string;
  notes?: string;
  nextAction?: string;
}

export interface WorkoutExercise {
  id: string;
  exercise: string;
  sets: string;
  reps: string;
  weight?: string;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
}

export interface BasketballSession {
  id: string;
  date: string;
  type: BasketballSessionType;
  note?: string;
}

export interface LeetcodeEntry {
  id: string;
  problemName: string;
  difficulty: Difficulty;
  pattern: string;
  status: LeetcodeStatus;
  datePracticed?: string;
  confidence: Confidence;
  notes?: string;
}

export interface SystemDesignEntry {
  id: string;
  topic: string;
  status: LeetcodeStatus;
  notes?: string;
  lastStudied?: string;
  confidence: Confidence;
  isPracticeCase: boolean;
}

export interface ProjectTask {
  id: string;
  task: string;
  owner?: string;
  dueDate?: string;
  status: TaskStatus;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  milestone?: string;
  nextAction: string;
  repositoryUrl?: string;
  status: ProjectStatus;
  completedAt?: string;
  tasks: ProjectTask[];
}

export interface SchoolProject {
  id: string;
  projectName: string;
  goal: string;
  currentPhase: string;
  teamMembers: string[];
  upcomingMilestone?: string;
  deadline?: string;
  notes?: string;
  pmAttention: string[];
  tasks: ProjectTask[];
}

export interface AdminTask {
  id: string;
  task: string;
  dueDate?: string;
  status: Exclude<TaskStatus, "blocked">;
  notes?: string;
}

export interface MentalLoadItem {
  id: string;
  text: string;
  area?: MentalLoadArea;
  capturedAt: string;
  completed: boolean;
}

export interface FocusSessionRecord {
  id: string;
  date: string;
  objective: string;
  completedText?: string;
  completedAt?: string;
}

export type CurriculumTrackId = "system-design" | "leetcode";
export type ProblemRating = "red" | "yellow" | "green";

export interface CurriculumDayProgress {
  completedOn?: string;
  note?: string;
}

export interface ProblemAttempt {
  date: string;
  rating: ProblemRating;
}

export interface CurriculumProblemProgress {
  slug: string;
  attempts: ProblemAttempt[];
  keyInsight?: string;
}

export interface CurriculumUserProblem {
  slug: string;
  name: string;
  pattern?: string;
  addedOn: string;
}

export interface CurriculumTrackProgress {
  trackId: CurriculumTrackId;
  contentVersion: number;
  startedOn?: string;
  currentDay: number;
  days: Record<string, CurriculumDayProgress>;
}

export interface SystemDesignCurriculumProgress extends CurriculumTrackProgress {
  trackId: "system-design";
}

export interface LeetcodeCurriculumProgress extends CurriculumTrackProgress {
  trackId: "leetcode";
  problems: Record<string, CurriculumProblemProgress>;
  userProblems: CurriculumUserProblem[];
}

export interface CurriculumWeek {
  week: number;
  title: string;
  intent: string;
  firstDay: number;
  lastDay: number;
}

export interface SystemDesignDay {
  dayId: string;
  day: number;
  week: number;
  title: string;
  mode: "learn" | "practice";
  learn: string[];
  exercise?: string;
  helloInterview?: string;
  alexXu?: string;
  caution?: string;
}

export interface LeetcodeProblem {
  slug: string;
  name: string;
  pattern: string;
  role: "solve" | "study";
  url?: string;
}

export interface LeetcodeDay {
  dayId: string;
  day: number;
  week: number;
  title: string;
  learn: string[];
  problems: LeetcodeProblem[];
  coldReview: string[];
  prompt?: string;
}

export interface AppState {
  version: 1;
  createdAt: string;
  updatedAt: string;
  settings: AppSettings;
  dailyEntries: Record<string, DailyEntry>;
  weeklyReviews: Record<string, WeekReview>;
  applications: Application[];
  projects: Project[];
  workoutTemplates: WorkoutTemplate[];
  basketballSessions: BasketballSession[];
  leetcodeEntries: LeetcodeEntry[];
  systemDesignEntries: SystemDesignEntry[];
  schoolProjects: SchoolProject[];
  adminInbox: AdminTask[];
  mentalLoadInbox: MentalLoadItem[];
  focusSessions: FocusSessionRecord[];
  systemDesignCurriculum: SystemDesignCurriculumProgress;
  leetcodeCurriculum: LeetcodeCurriculumProgress;
}
