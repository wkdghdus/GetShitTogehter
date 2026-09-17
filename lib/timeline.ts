import { getLocalDate } from "./dates";
import type {
  AdaptiveScheduleStatus,
  AppSettings,
  CompletionState,
  DailyEntry,
  EnergyMode,
  TimelineItem,
  TimelineMode,
} from "./types";

export interface AdaptiveScheduleInput {
  dailyEntry: DailyEntry;
  settings: AppSettings;
}

export interface AdaptiveScheduleResult {
  status: AdaptiveScheduleStatus;
  blocks: TimelineItem[];
  message: string;
  pendingCore: string[];
}

type CoreKind = "physical" | "focus";

interface Activity {
  id: CoreKind;
  kind: CoreKind;
  title: string;
  description: string;
  full: number;
  compressed: number;
  minimum: number;
  minimumTitle: string;
  minimumDescription: string;
}

const DAY_MINUTES = 24 * 60;
const PHYSICAL = { full: 60, compressed: 30, minimum: 20 };
const FOCUS = { full: 90, compressed: 45, minimum: 25 };
const DECOMPRESSION = { full: 30, compressed: 20 };
const MEAL = { full: 45, compressed: 30 };
const FREE_LIFE = { full: 120, compressed: 45 };
const WIND_DOWN = { full: 30, compressed: 20 };
const TRANSITION = 10;

function parseTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60 + minutes) % DAY_MINUTES;
}

function formatTime(minutes: number): string {
  const normalized = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hours = Math.floor(normalized / 60).toString().padStart(2, "0");
  const mins = (normalized % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function minutesAt(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function stateFrom(completed: boolean, state?: CompletionState): CompletionState {
  return state ?? (completed ? "completed" : "pending");
}

function isDone(state: CompletionState): boolean {
  return state === "completed" || state === "skipped";
}

function isWeekend(entry: DailyEntry): boolean {
  return entry.weekday === "saturday" || entry.weekday === "sunday";
}

function clampBedtimeDelay(minutes: number): number {
  return Math.max(0, Math.min(30, minutes));
}

function endOf(item: TimelineItem): number {
  return item.end ? parseTime(item.end) : parseTime(item.start);
}

function durationOf(item: TimelineItem): number {
  return Math.max(0, endOf(item) - parseTime(item.start));
}

function overlaps(a: TimelineItem, b: TimelineItem): boolean {
  return durationOf(a) > 0 && durationOf(b) > 0 && parseTime(a.start) < endOf(b) && parseTime(b.start) < endOf(a);
}

function sortTimeline(blocks: TimelineItem[]): TimelineItem[] {
  return [...blocks].sort((a, b) => parseTime(a.start) - parseTime(b.start));
}

function isPreserved(item: TimelineItem, current: number): boolean {
  if (item.id === "adaptive-status") return false;
  if (item.locked === true) return true;
  if (item.kind === "physical" || item.kind === "focus") return false;

  return (
    item.generated === false ||
    item.kind === "custom" ||
    item.state === "completed" ||
    item.state === "skipped" ||
    endOf(item) <= current
  );
}

function preservedBlocks(entry: DailyEntry, current: number): TimelineItem[] {
  return entry.timeline.filter((item) => isPreserved(item, current)).map((item) => ({ ...item }));
}

function block(
  id: string,
  start: number,
  duration: number,
  title: string,
  kind: TimelineItem["kind"],
  options: Partial<TimelineItem> = {},
): TimelineItem {
  return {
    id,
    start: formatTime(start),
    end: formatTime(start + duration),
    title,
    kind,
    state: "pending",
    generated: true,
    ...options,
  };
}

function pushGenerated(blocks: TimelineItem[], item: TimelineItem, latestEnd: number): number {
  let candidate = item;
  let guard = 0;

  while (blocks.some((existing) => overlaps(candidate, existing)) && guard < 20) {
    const conflict = blocks.filter((existing) => overlaps(candidate, existing)).sort((a, b) => endOf(b) - endOf(a))[0];
    const duration = durationOf(candidate);
    candidate = {
      ...candidate,
      start: formatTime(endOf(conflict)),
      end: formatTime(endOf(conflict) + duration),
    };
    guard += 1;
  }

  if (candidate.end && endOf(candidate) <= latestEnd && durationOf(candidate) > 0) {
    blocks.push(candidate);
    return endOf(candidate);
  }

  return parseTime(candidate.start);
}

function manualBlock(item: TimelineItem, entry: DailyEntry, energyMode: EnergyMode): TimelineItem {
  if (item.kind === "physical") {
    return {
      ...item,
      title: entry.physicalLabel,
      description: energyMode === "low" ? "Keep this intentionally light." : item.description,
      state: stateFrom(entry.physicalCompleted, entry.physicalStatus),
      compressed: energyMode === "low" || item.compressed,
      minimumViable: energyMode === "low" || item.minimumViable,
    };
  }

  if (item.kind === "work") {
    return { ...item, state: stateFrom(entry.workCompleted, entry.workStatus) };
  }

  if (item.kind === "focus") {
    return {
      ...item,
      title: entry.focusLabel,
      description: entry.focusObjective,
      state: stateFrom(entry.focusCompleted, entry.focusStatus),
      compressed: energyMode === "low" || item.compressed,
      minimumViable: energyMode === "low" || item.minimumViable,
    };
  }

  if (item.kind === "decompression") {
    return { ...item, state: entry.decompressionStatus ?? "pending" };
  }

  return { ...item, state: item.state ?? "pending" };
}

function manualTimeline(
  entry: DailyEntry,
  settings: AppSettings,
  mode: Exclude<TimelineMode, "adaptive">,
  energyMode: EnergyMode,
): TimelineItem[] {
  return settings.timelinePresets[mode].blocks
    .map((item) => manualBlock({ ...item }, entry, energyMode))
    .filter((item) => item.state !== "skipped")
    .filter((item) => !(item.kind === "physical" && entry.physicalType === "rest"))
    .sort((a, b) => parseTime(a.start) - parseTime(b.start));
}

function doneMarker(entry: DailyEntry, kind: CoreKind, state: CompletionState): TimelineItem {
  const isPhysical = kind === "physical";

  return {
    id: `${kind}-${state}`,
    start: isPhysical ? entry.physicalStart : entry.focusStart,
    end: isPhysical ? entry.physicalEnd : entry.focusEnd,
    title: isPhysical ? entry.physicalLabel : entry.focusLabel,
    kind,
    state,
    generated: true,
  };
}

function pendingActivities(entry: DailyEntry): Activity[] {
  const activities: Activity[] = [];
  const physicalState = stateFrom(entry.physicalCompleted, entry.physicalStatus);
  const focusState = stateFrom(entry.focusCompleted, entry.focusStatus);
  const lockedKinds = new Set(entry.timeline.filter((item) => item.locked).map((item) => item.kind));

  if (entry.physicalType !== "rest" && !isDone(physicalState) && !lockedKinds.has("physical")) {
    activities.push({
      id: "physical",
      kind: "physical",
      title: entry.physicalLabel,
      description: `${entry.physicalLabel} from today's weekly routine.`,
      full: PHYSICAL.full,
      compressed: PHYSICAL.compressed,
      minimum: PHYSICAL.minimum,
      minimumTitle: `Minimum ${entry.physicalLabel}`,
      minimumDescription: "Choose 10-20 minutes of mobility, walking, shooting, or light movement.",
    });
  }

  if (!isDone(focusState) && !lockedKinds.has("focus")) {
    const nextAction = entry.focusNextAction ?? entry.focusObjective;
    activities.push({
      id: "focus",
      kind: "focus",
      title: entry.focusLabel,
      description: entry.focusObjective,
      full: FOCUS.full,
      compressed: FOCUS.compressed,
      minimum: FOCUS.minimum,
      minimumTitle: `Minimum ${entry.focusLabel}`,
      minimumDescription: nextAction,
    });
  }

  return activities;
}

function pendingCore(entry: DailyEntry): string[] {
  const pending: string[] = [];

  if (entry.physicalType !== "rest" && stateFrom(entry.physicalCompleted, entry.physicalStatus) === "pending") {
    pending.push(entry.physicalLabel);
  }

  if (stateFrom(entry.focusCompleted, entry.focusStatus) === "pending") {
    pending.push(entry.focusLabel);
  }

  return pending;
}

function chooseStatus(
  current: number,
  latestEnd: number,
  workMinutes: number,
  activities: Activity[],
  needsDecompression: boolean,
  energyMode: EnergyMode,
): AdaptiveScheduleStatus {
  if (energyMode === "low") return "minimal";

  const remaining = Math.max(0, latestEnd - current - workMinutes);
  const transitions = Math.max(0, activities.length - 1) * TRANSITION;
  const fullEssentials =
    activities.reduce((sum, item) => sum + item.full, 0) +
    transitions +
    (needsDecompression ? DECOMPRESSION.full : 0) +
    (activities.length > 0 ? MEAL.full : 0) +
    WIND_DOWN.full;
  const compressedEssentials =
    activities.reduce((sum, item) => sum + item.compressed, 0) +
    transitions +
    (needsDecompression ? DECOMPRESSION.compressed : 0) +
    (activities.length > 0 ? MEAL.compressed : 0) +
    WIND_DOWN.compressed;

  if (activities.length === 0) return "on-track";
  if (remaining >= fullEssentials + FREE_LIFE.compressed) return current <= parseTime("17:00") ? "on-track" : "adjusted";
  if (remaining >= compressedEssentials) return "compressed";
  return "minimal";
}

function statusLabel(status: AdaptiveScheduleStatus): string {
  switch (status) {
    case "on-track":
      return "On Track";
    case "adjusted":
      return "Adjusted";
    case "compressed":
      return "Compressed";
    case "minimal":
      return "Low Energy";
  }
}

function scheduleMessage(now: Date, status: AdaptiveScheduleStatus, pending: string[]): string {
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const pendingText = pending.length === 0
    ? "the core commitments are handled"
    : `${pending.join(" and ")} ${pending.length === 1 ? "is" : "are"} still pending`;

  if (status === "minimal") {
    return `It's ${time}. ${pendingText}. Complete a small version and protect bedtime.`;
  }

  return `It's ${time}. ${pendingText}. The rest of today has been reorganized below.`;
}

function addSleep(blocks: TimelineItem[], settings: AppSettings): void {
  blocks.push({
    id: "sleep",
    start: settings.bedtime,
    title: "Sleep",
    kind: "sleep",
    state: "pending",
    generated: true,
    description: "Protect bedtime. Today does not need to be recovered in full.",
  });
}

export function generateAdaptiveSchedule(now: Date, input: AdaptiveScheduleInput): AdaptiveScheduleResult {
  const { dailyEntry, settings } = input;
  const current = minutesAt(now);
  const bedtime = parseTime(settings.bedtime);
  const latestEnd = bedtime + clampBedtimeDelay(settings.maximumAutomaticBedtimeDelayMinutes);
  const workState = stateFrom(dailyEntry.workCompleted, dailyEntry.workStatus);
  const needsWork = !isWeekend(dailyEntry) && !isDone(workState) && current < parseTime(settings.workEnd);
  const activities = pendingActivities(dailyEntry);
  const needsDecompression =
    !isDone(dailyEntry.decompressionStatus ?? "pending") &&
    (needsWork || current >= parseTime(settings.workEnd)) &&
    current < latestEnd - DECOMPRESSION.compressed;
  const status = chooseStatus(
    current,
    latestEnd,
    needsWork ? parseTime(settings.workEnd) - current : 0,
    activities,
    needsDecompression,
    dailyEntry.energyMode,
  );
  const blocks = preservedBlocks(dailyEntry, current);
  const pending = pendingCore(dailyEntry);
  let cursor = current;

  const physicalState = stateFrom(dailyEntry.physicalCompleted, dailyEntry.physicalStatus);
  const focusState = stateFrom(dailyEntry.focusCompleted, dailyEntry.focusStatus);
  if (isDone(physicalState)) blocks.push(doneMarker(dailyEntry, "physical", physicalState));
  if (isDone(focusState)) blocks.push(doneMarker(dailyEntry, "focus", focusState));

  if (needsWork) {
    cursor = pushGenerated(
      blocks,
      block("work", cursor, parseTime(settings.workEnd) - cursor, "Work responsibilities", "work", {
        description: "Finish the required workday responsibilities first.",
      }),
      latestEnd,
    );
    cursor = Math.max(cursor, parseTime(settings.commuteHomeTime));
  }

  if (needsDecompression) {
    const duration = status === "compressed" || status === "minimal"
      ? DECOMPRESSION.compressed
      : Math.min(settings.decompressionDurationMinutes, DECOMPRESSION.full);
    cursor = pushGenerated(
      blocks,
      block("decompression", cursor, duration, "Decompression", "decompression", {
        state: dailyEntry.decompressionStatus ?? "pending",
        compressed: status === "compressed" || status === "minimal",
        description: "Transition out of work before demanding personal tasks.",
      }),
      latestEnd,
    );
  }

  const mealBeforeActivities = current >= parseTime("20:00") || status === "minimal";
  const compressed = status === "compressed";
  const minimum = status === "minimal";
  const mealDuration = compressed || minimum ? MEAL.compressed : MEAL.full;
  const windDownDuration = compressed || minimum ? WIND_DOWN.compressed : WIND_DOWN.full;

  if (activities.length > 0 && mealBeforeActivities && cursor + MEAL.compressed + windDownDuration <= latestEnd) {
    cursor = pushGenerated(blocks, block("dinner", cursor, mealDuration, "Dinner / reset", "meal", { compressed: compressed || minimum }), latestEnd);
  }

  activities.forEach((activity, index) => {
    const duration = minimum ? activity.minimum : compressed ? activity.compressed : activity.full;
    cursor = pushGenerated(
      blocks,
      block(activity.id, cursor, duration, minimum ? activity.minimumTitle : activity.title, activity.kind, {
        description: minimum ? activity.minimumDescription : activity.description,
        compressed,
        minimumViable: minimum,
      }),
      latestEnd,
    );

    if (index < activities.length - 1 && cursor + TRANSITION < latestEnd) {
      cursor += TRANSITION;
    }
  });

  if (activities.length > 0 && !mealBeforeActivities && cursor + MEAL.compressed + windDownDuration <= latestEnd) {
    cursor = pushGenerated(blocks, block("dinner", cursor, mealDuration, "Shower + dinner", "meal", { compressed }), latestEnd);
  }

  const freeLifeEnd = latestEnd - windDownDuration;
  const freeLifeDuration = Math.min(compressed || minimum ? FREE_LIFE.compressed : FREE_LIFE.full, Math.max(0, freeLifeEnd - cursor));

  if (freeLifeDuration >= 15) {
    cursor = pushGenerated(
      blocks,
      block("free-life", cursor, freeLifeDuration, "Free life", "life", {
        compressed: compressed || minimum,
        description: "Keep some intentional personal time whenever realistically possible.",
      }),
      latestEnd,
    );
  }

  if (latestEnd - cursor > 0) {
    const start = Math.max(cursor, latestEnd - windDownDuration);
    pushGenerated(blocks, block("shutdown", start, latestEnd - start, "Shutdown / wind-down", "shutdown", { compressed: compressed || minimum }), latestEnd);
  }

  addSleep(blocks, settings);

  const message = scheduleMessage(now, status, pending);
  blocks.push({
    id: "adaptive-status",
    start: formatTime(current),
    title: statusLabel(status),
    kind: "anchor",
    generated: true,
    description: message,
  });

  return {
    status,
    blocks: sortTimeline(blocks),
    message,
    pendingCore: pending,
  };
}

export function generateDailyTimeline({
  dailyEntry,
  settings,
  timelineMode,
  energyMode,
  now = new Date(),
}: {
  dailyEntry: DailyEntry;
  settings: AppSettings;
  timelineMode: TimelineMode;
  energyMode: EnergyMode;
  now?: Date;
}): TimelineItem[] {
  if (timelineMode !== "adaptive") {
    return manualTimeline(dailyEntry, settings, timelineMode, energyMode);
  }

  return generateAdaptiveSchedule(now, { dailyEntry: { ...dailyEntry, energyMode }, settings }).blocks;
}

export function arrangeDailyEntry(
  dailyEntry: DailyEntry,
  timelineMode: TimelineMode,
  energyMode: EnergyMode,
  settings: AppSettings,
  now = new Date(),
): DailyEntry {
  const normalized: DailyEntry = {
    ...dailyEntry,
    timelineMode,
    energyMode,
    physicalStatus: stateFrom(dailyEntry.physicalCompleted, dailyEntry.physicalStatus),
    workStatus: stateFrom(dailyEntry.workCompleted, dailyEntry.workStatus),
    focusStatus: stateFrom(dailyEntry.focusCompleted, dailyEntry.focusStatus),
    decompressionStatus: dailyEntry.decompressionStatus ?? "pending",
    focusNextAction: dailyEntry.focusNextAction ?? dailyEntry.focusObjective,
  };

  if (timelineMode === "adaptive" && normalized.date < getLocalDate(now) && normalized.timeline.length > 0) {
    return normalized;
  }

  if (timelineMode === "adaptive") {
    const result = generateAdaptiveSchedule(now, { dailyEntry: normalized, settings });
    const physical = result.blocks.find((item) => item.kind === "physical");
    const focus = result.blocks.find((item) => item.kind === "focus");

    return {
      ...normalized,
      physicalCompleted: normalized.physicalStatus === "completed",
      workCompleted: normalized.workStatus === "completed",
      focusCompleted: normalized.focusStatus === "completed",
      physicalStart: physical?.start ?? normalized.physicalStart,
      physicalEnd: physical?.end ?? normalized.physicalEnd,
      focusStart: focus?.start ?? normalized.focusStart,
      focusEnd: focus?.end ?? normalized.focusEnd,
      generatedStatus: result.status,
      generatedMessage: result.message,
      pendingCore: result.pendingCore,
      timeline: result.blocks,
    };
  }

  const timeline = manualTimeline(normalized, settings, timelineMode, energyMode);
  const physical = timeline.find((item) => item.kind === "physical");
  const focus = timeline.find((item) => item.kind === "focus");

  return {
    ...normalized,
    physicalCompleted: normalized.physicalStatus === "completed",
    workCompleted: normalized.workStatus === "completed",
    focusCompleted: normalized.focusStatus === "completed",
    physicalStart: physical?.start ?? normalized.physicalStart,
    physicalEnd: physical?.end ?? normalized.physicalEnd,
    focusStart: focus?.start ?? normalized.focusStart,
    focusEnd: focus?.end ?? normalized.focusEnd,
    generatedStatus: undefined,
    generatedMessage: undefined,
    pendingCore: pendingCore(normalized),
    timeline,
  };
}

export function getTimelineStatusLabel(entryOrTimeline: DailyEntry | TimelineItem[]): string {
  const timeline = Array.isArray(entryOrTimeline) ? entryOrTimeline : entryOrTimeline.timeline;
  const status = timeline.find((item) => item.id === "adaptive-status");
  return status?.title ?? "Manual";
}

export function getPendingCoreActivities(entry: DailyEntry): string[] {
  return pendingCore(entry);
}

export function getBlockDuration(item: TimelineItem): number {
  return durationOf(item);
}

export interface RightNow {
  current?: TimelineItem;
  next?: TimelineItem;
}

export function getRightNow(entry: DailyEntry, now: Date = new Date()): RightNow {
  const items = sortTimeline(entry.timeline.filter((item) => item.id !== "adaptive-status"));
  const current = minutesAt(now);
  const currentIndex = items.reduce(
    (found, item, index) => (parseTime(item.start) <= current ? index : found),
    -1,
  );

  return {
    current: currentIndex >= 0 ? items[currentIndex] : undefined,
    next: currentIndex + 1 < items.length ? items[currentIndex + 1] : undefined,
  };
}

export type TrackedActivity = "physical" | "focus" | "work" | "decompression";

/**
 * Marks a single activity's completion state in place: updates its status field(s) and the
 * matching timeline block(s) only. Every other block's timing/title is untouched. Adaptive
 * planning only recomputes the remaining schedule when the user explicitly asks for it (the
 * Adapt Plan action) — never as a side effect of checking something off.
 */
export function setActivityState(entry: DailyEntry, activity: TrackedActivity, state: CompletionState): DailyEntry {
  const timeline = entry.timeline.map((item) => (item.kind === activity ? { ...item, state } : item));

  switch (activity) {
    case "physical":
      return { ...entry, timeline, physicalStatus: state, physicalCompleted: state === "completed" };
    case "focus":
      return { ...entry, timeline, focusStatus: state, focusCompleted: state === "completed" };
    case "work":
      return { ...entry, timeline, workStatus: state, workCompleted: state === "completed" };
    case "decompression":
      return { ...entry, timeline, decompressionStatus: state };
  }
}

export interface FocusContentPatch {
  focusLabel?: string;
  focusObjective?: string;
  focusNote?: string;
}

/**
 * Updates the focus label/objective/note in place and syncs the matching focus timeline
 * block's title/description to match. Does not touch any block's timing.
 */
export function updateFocusContent(entry: DailyEntry, patch: FocusContentPatch): DailyEntry {
  const focusLabel = patch.focusLabel ?? entry.focusLabel;
  const focusObjective = patch.focusObjective ?? entry.focusObjective;

  return {
    ...entry,
    ...patch,
    timeline: entry.timeline.map((item) =>
      item.kind === "focus" ? { ...item, title: focusLabel, description: focusObjective } : item,
    ),
  };
}
