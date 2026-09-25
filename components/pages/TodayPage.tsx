"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { createId } from "@/lib/defaults";
import { formatDisplayDate, getWeekStart, isWeekend } from "@/lib/dates";
import {
  arrangeDailyEntry,
  getPendingCoreActivities,
  getRightNow,
  getTimelineStatusLabel,
  setActivityState,
  setBlockTime,
  updateFocusContent,
} from "@/lib/timeline";
import type { DailyEntry, EnergyMode, MentalLoadArea, TimelineMode } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CheckboxRow,
  Field,
  Input,
  SectionHeader,
  Select,
  SimpleGrid,
  Textarea,
  cn,
} from "@/components/ui";

type WinKey = "body" | "work" | "future";

const mentalLoadAreas: Array<{ value: MentalLoadArea; label: string }> = [
  { value: "career", label: "Career" },
  { value: "applications", label: "Applications" },
  { value: "project", label: "Project" },
  { value: "school", label: "School" },
  { value: "admin", label: "Admin" },
  { value: "personal", label: "Personal" },
];

const lowEnergyChoices = [
  "one Leetcode problem",
  "one application",
  "one small project task",
  "one system design topic",
  "walk",
  "mobility",
  "light workout",
  "casual basketball",
  "family",
  "girlfriend",
  "coffee",
  "outside",
  "entertainment",
  "rest",
];

const decompressionIdeas = ["lie down", "listen to music", "walk", "snack", "shower", "sit outside", "talk to family"];
const freeLifeIdeas = [
  "call girlfriend",
  "family",
  "friends",
  "coffee",
  "walk",
  "gaming",
  "YouTube",
  "movie",
  "basketball highlights",
  "reading",
  "nothing",
];

function timeRange(start: string, end?: string) {
  return end ? `${start} - ${end}` : start;
}

function sortEntries(entries: Record<string, DailyEntry>) {
  return Object.values(entries).sort((a, b) => b.date.localeCompare(a.date));
}

function getWins(entry: DailyEntry): Record<WinKey, boolean> {
  return {
    body: entry.physicalCompleted || entry.physicalType === "rest",
    work: isWeekend(entry.date) || entry.workCompleted,
    future: entry.focusCompleted,
  };
}

function calculateDayStatus(entry: DailyEntry) {
  const wins = getWins(entry);
  const requiredWins: WinKey[] = isWeekend(entry.date) ? ["body", "future"] : ["body", "work", "future"];
  const completed = requiredWins.filter((key) => wins[key]).length;

  if (completed === requiredWins.length) {
    return {
      title: "Day Complete",
      description: "You've done enough today.",
      tone: "success" as const,
      completed,
      total: requiredWins.length,
    };
  }

  if (completed >= requiredWins.length - 1) {
    return {
      title: "Solid Day",
      description: "One area remains, but the day is not a failure.",
      tone: "accent" as const,
      completed,
      total: requiredWins.length,
    };
  }

  return {
    title: "Steady Day",
    description: "Keep the day bounded. Capture loose ends instead of carrying them in your head.",
    tone: "neutral" as const,
    completed,
    total: requiredWins.length,
  };
}

function historyStatus(entry: DailyEntry) {
  if (entry.physicalType === "rest" && !entry.focusCompleted) return "Rest";
  if (entry.physicalType === "recovery" && entry.physicalCompleted) return "Recovery";

  const status = calculateDayStatus(entry);
  if (status.completed === status.total) return "Complete";
  if (status.completed >= Math.max(1, status.total - 1)) return "Solid";
  return "Rest";
}

function TimelineKindBadge({ kind }: { kind: DailyEntry["timeline"][number]["kind"] }) {
  const label = {
    anchor: "Anchor",
    physical: "Body",
    work: "Work",
    decompression: "Protected",
    meal: "Life",
    focus: "Future",
    life: "Protected",
    shutdown: "Shutdown",
    sleep: "Sleep",
    custom: "Custom",
  }[kind];

  return (
    <Badge tone={kind === "decompression" || kind === "life" ? "accent" : "neutral"} className="shrink-0">
      {label}
    </Badge>
  );
}

export function TodayPage() {
  const { state, today, todayDate, isHydrated, setState, updateToday } = useAppState();
  const [focusLabel, setFocusLabel] = useState("");
  const [focusObjective, setFocusObjective] = useState("");
  const [focusNote, setFocusNote] = useState("");
  const [mentalLoadText, setMentalLoadText] = useState("");
  const [mentalLoadArea, setMentalLoadArea] = useState<MentalLoadArea>("admin");
  const [shutdownDone, setShutdownDone] = useState("");
  const [tomorrowPriority, setTomorrowPriority] = useState("");
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(todayDate);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  useEffect(() => {
    if (!today) return;
    setFocusLabel(today.focusLabel);
    setFocusObjective(today.focusObjective);
    setFocusNote(today.focusNote ?? "");
    setShutdownDone(today.shutdownDone ?? "");
    setTomorrowPriority(today.tomorrowPriority ?? "");
    setSelectedHistoryDate((current) => current || today.date);
  }, [today]);

  const historyEntries = useMemo(() => (state ? sortEntries(state.dailyEntries).slice(0, 14) : []), [state]);
  const selectedHistory = useMemo(() => {
    if (!state) return null;
    return state.dailyEntries[selectedHistoryDate] ?? historyEntries[0] ?? null;
  }, [historyEntries, selectedHistoryDate, state]);

  if (!isHydrated || !state || !today) {
    return <p className="text-[color:var(--muted)]">Loading today&apos;s routine...</p>;
  }

  const dayStatus = calculateDayStatus(today);
  const timelineStatusLabel = today.timelineMode === "adaptive"
    ? getTimelineStatusLabel(today.timeline)
    : today.timelineMode === "late-wake" ? "Manual Late Wake" : "Manual Normal";
  const pendingCoreActivities = getPendingCoreActivities(today);
  const rightNow = today.timelineMode === "adaptive" ? getRightNow(today) : undefined;
  const weekStart = getWeekStart(todayDate);
  const weekReview = state.weeklyReviews[weekStart];
  const weeklyOutcomes = weekReview?.priorities ?? [];
  const wins = getWins(today);
  const weekend = isWeekend(today.date);
  const workBlock = today.timeline.find((item) => item.id === "work");
  const freeLifeBlock = today.timeline.find((item) => item.id === "free-life");
  const shutdownBlock = today.timeline.find((item) => item.id === "shutdown");
  const activeProject = today.focusCategory === "project"
    ? state.projects.find((project) => project.status === "active")
    : undefined;

  const updateSetup = (timelineMode: TimelineMode, energyMode: EnergyMode) => {
    updateToday((entry) => arrangeDailyEntry(entry, timelineMode, energyMode, state.settings, new Date()));
  };

  const adaptPlan = () => {
    updateToday((entry) => arrangeDailyEntry(entry, entry.timelineMode, entry.energyMode, state.settings, new Date()));
  };

  const updateActivityStatus = (
    activity: "physical" | "focus" | "work" | "decompression",
    status: "pending" | "completed" | "skipped",
  ) => {
    updateToday((entry) => setActivityState(entry, activity, status));
  };

  const toggleTimelineLock = (id: string) => {
    updateToday((entry) => ({
      ...entry,
      timeline: entry.timeline.map((item) => (item.id === id ? { ...item, locked: !item.locked } : item)),
    }));
  };

  const startEditingBlockTime = (id: string, start: string, end?: string) => {
    setEditingBlockId(id);
    setEditStart(start);
    setEditEnd(end ?? "");
  };

  const cancelEditingBlockTime = () => {
    setEditingBlockId(null);
  };

  const saveBlockTime = (id: string, start: string, end: string) => {
    if (!start) return;
    updateToday((entry) => setBlockTime(entry, id, start, end || undefined));
    setEditingBlockId(null);
  };

  const saveFocus = () => {
    updateToday((entry) => ({
      ...updateFocusContent(entry, {
        focusLabel: focusLabel.trim() || entry.focusLabel,
        focusObjective: focusObjective.trim() || entry.focusObjective,
      }),
      focusNote: focusNote.trim() || undefined,
    }));
  };

  const addMentalLoadItem = () => {
    const text = mentalLoadText.trim();
    if (!text) return;

    setState((current) => ({
      ...current,
      mentalLoadInbox: [
        {
          id: createId("mental-load"),
          text,
          area: mentalLoadArea,
          capturedAt: new Date().toISOString(),
          completed: false,
        },
        ...current.mentalLoadInbox,
      ],
    }));
    setMentalLoadText("");
  };

  const updateMentalLoadArea = (id: string, area: MentalLoadArea) => {
    setState((current) => ({
      ...current,
      mentalLoadInbox: current.mentalLoadInbox.map((item) => (item.id === id ? { ...item, area } : item)),
    }));
  };

  const toggleMentalLoadDone = (id: string, completed: boolean) => {
    setState((current) => ({
      ...current,
      mentalLoadInbox: current.mentalLoadInbox.map((item) => (item.id === id ? { ...item, completed } : item)),
    }));
  };

  const saveShutdown = () => {
    updateToday((entry) => ({
      ...entry,
      shutdownDone: shutdownDone.trim() || undefined,
      tomorrowPriority: tomorrowPriority.trim() || undefined,
      shutdownCompletedAt: new Date().toISOString(),
    }));
  };

  const activeMentalLoadItems = state.mentalLoadInbox.filter((item) => !item.completed).slice(0, 6);

  return (
    <div>
      <SectionHeader
        eyebrow="Today"
        title={formatDisplayDate(todayDate)}
        description="One physical win, normal responsibilities, and one future-oriented win make the day successful."
        action={<Badge tone={dayStatus.tone}>{`${dayStatus.completed} / ${dayStatus.total} wins`}</Badge>}
      />

      <Card className="mb-5">
        <CardHeader
          title="Today's Plan"
          description={`Mode: ${today.timelineMode === "adaptive" ? "Adaptive" : today.timelineMode === "late-wake" ? "Late Wake" : "Normal"} · Current status: ${timelineStatusLabel}`}
          action={<Button variant="secondary" onClick={adaptPlan}>Adapt Plan</Button>}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold text-[color:var(--text)]">Timeline</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Today's timeline">
              <Button
                variant={today.timelineMode === "adaptive" ? "primary" : "secondary"}
                aria-pressed={today.timelineMode === "adaptive"}
                onClick={() => updateSetup("adaptive", today.energyMode)}
              >
                Adaptive
              </Button>
              <Button
                variant={today.timelineMode === "normal" ? "primary" : "secondary"}
                aria-pressed={today.timelineMode === "normal"}
                onClick={() => updateSetup("normal", today.energyMode)}
              >
                Normal Day
              </Button>
              <Button
                variant={today.timelineMode === "late-wake" ? "primary" : "secondary"}
                aria-pressed={today.timelineMode === "late-wake"}
                onClick={() => updateSetup("late-wake", today.energyMode)}
              >
                Late Wake Day
              </Button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-[color:var(--text)]">Energy</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Today's energy">
              <Button
                variant={today.energyMode === "normal" ? "primary" : "secondary"}
                aria-pressed={today.energyMode === "normal"}
                onClick={() => updateSetup(today.timelineMode, "normal")}
              >
                Normal
              </Button>
              <Button
                variant={today.energyMode === "low" ? "primary" : "secondary"}
                aria-pressed={today.energyMode === "low"}
                onClick={() => updateSetup(today.timelineMode, "low")}
              >
                Low Energy
              </Button>
            </div>
          </div>
        </div>
        {today.timelineMode === "adaptive" ? (
          <div className="mt-5 rounded-lg bg-[color:var(--surface-muted)] p-4">
            <h3 className="font-bold text-[color:var(--text)]">Adaptive Timeline</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              This schedule only changes when you click Adapt Plan. It will not silently rearrange
              itself as time passes — click Adapt Plan whenever you want the remaining day rebuilt
              from the current time, completion state, energy, and bedtime.
            </p>
          </div>
        ) : today.timelineMode === "late-wake" ? (
          <div className="mt-5 rounded-lg bg-[color:var(--surface-muted)] p-4">
            <h3 className="font-bold text-[color:var(--text)]">Late Wake Timeline</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Morning training has been moved to this evening. Your priorities for today remain the same.
            </p>
          </div>
        ) : null}
      </Card>

      {rightNow ? (
        <Card className="mb-5" tone="quiet">
          <CardHeader
            title="Right Now"
            description={rightNow.current ? timeRange(rightNow.current.start, rightNow.current.end) : "The day hasn't started yet."}
          />
          {rightNow.current ? (
            <div>
              <h3 className="font-bold text-[color:var(--text)]">{rightNow.current.title}</h3>
              {rightNow.current.description ? (
                <p className="text-sm text-[color:var(--muted)]">{rightNow.current.description}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">Nothing scheduled yet.</p>
          )}
          {rightNow.next ? (
            <div className="mt-4 border-t border-[color:var(--border)] pt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">Next</p>
              <h4 className="font-bold text-[color:var(--text)]">{rightNow.next.title}</h4>
              <p className="text-sm text-[color:var(--muted)]">Starts at {rightNow.next.start}</p>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="mb-5" tone="quiet">
        <CardHeader title="Still Meaningful Today" description="Only today's core pending commitments appear here." />
        {pendingCoreActivities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {pendingCoreActivities.map((activity) => (
              <Badge key={activity} tone="accent">{activity}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--muted)]">No core commitments are pending.</p>
        )}
      </Card>

      <Card tone={dayStatus.tone === "success" ? "success" : "quiet"} className="mb-5">
        <div>
          <h2 className="text-2xl font-bold text-[color:var(--text)]">{dayStatus.title}</h2>
          <p className="mt-1 text-[color:var(--muted)]">{dayStatus.description}</p>
        </div>
      </Card>

      <SimpleGrid>
        <Card tone={wins.body ? "success" : "default"}>
          <CardHeader
            title="Body"
            description={today.timelineMode === "adaptive"
              ? "Adaptive mode moves, compresses, or minimizes physical activity when useful."
              : today.timelineMode === "late-wake"
              ? "Physical activity follows protected decompression."
              : "Morning physical activity is the physical win."}
          />
          <p className="text-2xl font-bold text-[color:var(--text)]">{today.physicalLabel}</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {today.physicalCompleted && today.timelineMode === "late-wake"
              ? "Physical activity already completed."
              : timeRange(today.physicalStart, today.physicalEnd)}
          </p>
          <CheckboxRow
            className="mt-5"
            label="Completed"
            description={today.physicalType === "rest" ? "Rest counts as following the plan." : undefined}
            checked={today.physicalCompleted}
            onChange={(event) => updateActivityStatus("physical", event.target.checked ? "completed" : "pending")}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => updateActivityStatus("physical", "skipped")}>
              Skip for Today
            </Button>
            {today.physicalStatus === "skipped" ? (
              <Button variant="secondary" onClick={() => updateActivityStatus("physical", "pending")}>
                Restore
              </Button>
            ) : null}
          </div>
        </Card>

        <Card tone={wins.work ? "success" : "default"}>
          <CardHeader
            title="Work"
            description={weekend ? "Weekends do not require the 9-5 workday condition." : "Keep this simple."}
          />
          <p className="text-2xl font-bold text-[color:var(--text)]">
            {weekend ? "No workday required" : timeRange(workBlock?.start ?? state.settings.workStart, workBlock?.end ?? state.settings.workEnd)}
          </p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Only the workday block is tracked here.
          </p>
          <CheckboxRow
            className="mt-5"
            label="Workday complete"
            checked={today.workCompleted}
            disabled={weekend}
            onChange={(event) => updateActivityStatus("work", event.target.checked ? "completed" : "pending")}
          />
        </Card>

        <Card tone={wins.future ? "success" : "default"}>
          <CardHeader
            title="Future"
            description={`Exactly one primary objective · ${timeRange(today.focusStart, today.focusEnd)}`}
          />
          <div className="space-y-3">
            <Field label="Focus label">
              <Input value={focusLabel} onChange={(event) => setFocusLabel(event.target.value)} />
            </Field>
            <Field label="Primary objective">
              <Textarea
                value={focusObjective}
                onChange={(event) => setFocusObjective(event.target.value)}
                className="min-h-24"
              />
            </Field>
            <Field label="Short note">
              <Input
                value={focusNote}
                onChange={(event) => setFocusNote(event.target.value)}
                placeholder="Optional completion note"
              />
            </Field>
          </div>
          {activeProject ? (
            <div className="mt-4 rounded-lg bg-[color:var(--primary-soft)] p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--accent)]">
                {activeProject.name} · Next Meaningful Action
              </p>
              <p className="mt-1 text-sm font-bold text-[color:var(--text)]">{activeProject.nextAction}</p>
              <Button variant="ghost" className="mt-2 px-0" onClick={() => setFocusObjective(activeProject.nextAction)}>
                Use as today&apos;s objective
              </Button>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={saveFocus}>Save objective</Button>
            <Button
              variant="secondary"
              onClick={() => updateActivityStatus("focus", "completed")}
            >
              Mark Complete
            </Button>
            <Button
              variant="ghost"
              onClick={() => updateActivityStatus("focus", "pending")}
            >
              Reopen
            </Button>
            <Button variant="ghost" onClick={() => updateActivityStatus("focus", "skipped")}>
              Skip for Today
            </Button>
            <Link
              href="/focus"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[color:var(--border-strong)] bg-white px-4 py-2 text-sm font-bold text-[color:var(--text)] transition hover:bg-[color:var(--surface-muted)]"
            >
              Start Focus Session
            </Link>
          </div>
        </Card>
      </SimpleGrid>

      {today.energyMode === "low" ? (
        <Card className="mt-5" tone="quiet">
          <CardHeader
            title="Low Energy Mode"
            description="Consistency at reduced intensity is better than alternating between extremes and avoidance."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="font-bold text-[color:var(--text)]">Career</h3>
              <p className="text-sm text-[color:var(--muted)]">25 minutes. Choose one small future action.</p>
            </div>
            <div>
              <h3 className="font-bold text-[color:var(--text)]">Body</h3>
              <p className="text-sm text-[color:var(--muted)]">20 minutes. Walk, mobility, light workout, or casual basketball.</p>
            </div>
            <div>
              <h3 className="font-bold text-[color:var(--text)]">Life</h3>
              <p className="text-sm text-[color:var(--muted)]">At least 30 minutes for family, rest, outside, or entertainment.</p>
            </div>
          </div>
          <Field label="Low-energy choice" className="mt-4">
            <Select
              value={today.lowEnergyChoice ?? ""}
              onChange={(event) =>
                updateToday((entry) => ({
                  ...entry,
                  lowEnergyChoice: event.target.value || undefined,
                }))
              }
            >
              <option value="">Choose one reduced-intensity option</option>
              {lowEnergyChoices.map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </Select>
          </Field>
        </Card>
      ) : null}

      <section className="mt-8">
          <SectionHeader
          eyebrow="Routine"
          title={today.timelineMode === "adaptive"
            ? "Rest of Today"
            : today.timelineMode === "late-wake" ? "Late Wake Timeline" : "Normal Day Timeline"}
          description={today.timelineMode === "adaptive"
            ? "A rebuilt schedule for the remaining day. These are boundaries and reminders, not another checklist."
            : today.timelineMode === "late-wake"
            ? "The same priorities, arranged without rushing the morning. These blocks are reminders, not another checklist."
            : "A chronological shape for the day. These are boundaries and reminders, not another checklist."}
        />
        <Card>
          <ol className="space-y-4">
            {today.timeline.filter((item) => item.id !== "adaptive-status").map((item) => (
              <li
                key={item.id}
                className={cn(
                  "grid gap-3 border-b border-[color:var(--border)] pb-4 last:border-0 last:pb-0",
                  editingBlockId === item.id ? "sm:grid-cols-1" : "sm:grid-cols-[8rem_minmax(0,1fr)_auto]",
                )}
              >
                {editingBlockId === item.id ? (
                  <div className="flex flex-wrap gap-2">
                    <Input
                      type="time"
                      value={editStart}
                      onChange={(event) => setEditStart(event.target.value)}
                      aria-label={`Start time for ${item.title}`}
                    />
                    <Input
                      type="time"
                      value={editEnd}
                      onChange={(event) => setEditEnd(event.target.value)}
                      aria-label={`End time for ${item.title}`}
                    />
                  </div>
                ) : (
                  <p className="font-mono text-sm font-bold text-[color:var(--muted)]">{timeRange(item.start, item.end)}</p>
                )}
                <div>
                  <h3 className="font-bold text-[color:var(--text)]">{item.title}</h3>
                  {item.description ? <p className="text-sm text-[color:var(--muted)]">{item.description}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <TimelineKindBadge kind={item.kind} />
                  {editingBlockId === item.id ? (
                    <>
                      <Button variant="ghost" onClick={() => saveBlockTime(item.id, editStart, editEnd)} disabled={!editStart}>
                        Save
                      </Button>
                      <Button variant="ghost" onClick={cancelEditingBlockTime}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" onClick={() => startEditingBlockTime(item.id, item.start, item.end)}>
                      Edit time
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => toggleTimelineLock(item.id)}>
                    {item.locked ? "Locked" : "Lock"}
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <SimpleGrid className="mt-8 xl:grid-cols-2">
        <Card tone="quiet">
          <CardHeader
            title="Decompression"
            description="Work is finished. Do not immediately begin career tasks."
            action={today.decompressionStatus === "completed"
              ? <Badge tone="success">Done</Badge>
              : <Button variant="secondary" onClick={() => updateActivityStatus("decompression", "completed")}>Mark Done</Button>}
          />
          <p className="text-sm text-[color:var(--muted)]">
            Mental transition from work to personal life is necessary, not wasted time.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {decompressionIdeas.map((idea) => (
              <Badge key={idea} tone="accent">
                {idea}
              </Badge>
            ))}
          </div>
        </Card>

        <Card tone="quiet">
          <CardHeader
            title="Free Life"
            description={`${timeRange(freeLifeBlock?.start ?? state.settings.freeLifeStart, freeLifeBlock?.end ?? state.settings.freeLifeEnd)}. This is part of the routine.`}
          />
          <p className="text-sm text-[color:var(--muted)]">
            The planned focus block being completed is enough. This time does not need to be earned through exhaustion.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {freeLifeIdeas.map((idea) => (
              <Badge key={idea}>{idea}</Badge>
            ))}
          </div>
        </Card>
      </SimpleGrid>

      <SimpleGrid className="mt-8 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Mental Load"
            description="Captured does not mean it must be completed today."
          />
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto]">
            <Input
              value={mentalLoadText}
              onChange={(event) => setMentalLoadText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addMentalLoadItem();
              }}
              placeholder="apply to Shopify, send professor message, book dentist"
            />
            <Select value={mentalLoadArea} onChange={(event) => setMentalLoadArea(event.target.value as MentalLoadArea)}>
              {mentalLoadAreas.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </Select>
            <Button onClick={addMentalLoadItem}>Capture</Button>
          </div>
          <div className="mt-4 space-y-2">
            {activeMentalLoadItems.length > 0 ? (
              activeMentalLoadItems.map((item) => (
                <div key={item.id} className="grid gap-2 rounded-lg border border-[color:var(--border)] bg-white p-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-center">
                  <span className="text-sm font-bold text-[color:var(--text)]">{item.text}</span>
                  <Select
                    value={item.area ?? "personal"}
                    onChange={(event) => updateMentalLoadArea(item.id, event.target.value as MentalLoadArea)}
                    aria-label={`Assign ${item.text}`}
                  >
                    {mentalLoadAreas.map((area) => (
                      <option key={area.value} value={area.value}>
                        {area.label}
                      </option>
                    ))}
                  </Select>
                  <Button variant="ghost" onClick={() => toggleMentalLoadDone(item.id, true)}>
                    Done
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">No open mental-load items.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Nightly Shutdown"
            description={`${shutdownBlock?.start ?? state.settings.freeLifeEnd} is today's cue to close the day.`}
          />
          <div className="space-y-3">
            <Field label="Done today">
              <Textarea
                value={shutdownDone}
                onChange={(event) => setShutdownDone(event.target.value)}
                placeholder="Worked, gym, solved sliding-window problem"
              />
            </Field>
            <Field label="Tomorrow's one important thing">
              <Input
                value={tomorrowPriority}
                onChange={(event) => setTomorrowPriority(event.target.value)}
                placeholder="Submit Wealthsimple application"
              />
            </Field>
            <Button onClick={saveShutdown}>Save shutdown</Button>
            {today.shutdownCompletedAt ? (
              <p className="rounded-lg bg-[color:var(--primary-soft)] p-3 text-sm font-bold text-[color:var(--success)]">
                Today&apos;s work is finished.
              </p>
            ) : null}
          </div>
        </Card>
      </SimpleGrid>

      <SimpleGrid className="mt-8 xl:grid-cols-2">
        <Card>
          <CardHeader title="This Week's Three Outcomes" description="Exactly three major outcomes. Everything else is secondary." />
          <ol className="space-y-3">
            {[0, 1, 2].map((index) => {
              const outcome = weeklyOutcomes[index];
              return (
                <li key={outcome?.id ?? index} className="flex gap-3 rounded-lg border border-[color:var(--border)] bg-white p-3">
                  <span className="font-bold text-[color:var(--accent)]">{index + 1}.</span>
                  <span className={cn("text-sm", outcome?.completed ? "text-[color:var(--success)]" : "text-[color:var(--text)]")}>
                    {outcome?.text || "Set this outcome in Weekly Review."}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card>
          <CardHeader title="Recent History" description="No streak mechanics. Select a day to inspect the basics." />
          <div className="grid gap-2 sm:grid-cols-2">
            {historyEntries.map((entry) => (
              <button
                key={entry.date}
                type="button"
                className={cn(
                  "rounded-lg border p-3 text-left transition hover:bg-[color:var(--surface-muted)]",
                  selectedHistory?.date === entry.date
                    ? "border-[color:var(--primary)] bg-[color:var(--primary-soft)]"
                    : "border-[color:var(--border)] bg-white",
                )}
                onClick={() => setSelectedHistoryDate(entry.date)}
              >
                <span className="block text-sm font-bold text-[color:var(--text)]">{formatDisplayDate(entry.date)}</span>
                <span className="mt-1 inline-block text-xs font-bold text-[color:var(--muted)]">{historyStatus(entry)}</span>
              </button>
            ))}
          </div>
          {selectedHistory ? (
            <div className="mt-4 rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm">
              <h3 className="font-bold text-[color:var(--text)]">{formatDisplayDate(selectedHistory.date)}</h3>
              <dl className="mt-3 grid gap-2">
                <div>
                  <dt className="font-bold text-[color:var(--muted)]">Physical activity</dt>
                  <dd>{selectedHistory.physicalLabel}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[color:var(--muted)]">Evening focus</dt>
                  <dd>{selectedHistory.focusLabel}: {selectedHistory.focusObjective}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[color:var(--muted)]">Focus note</dt>
                  <dd>{selectedHistory.focusNote || "No note saved."}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[color:var(--muted)]">Shutdown note</dt>
                  <dd>{selectedHistory.shutdownDone || "No shutdown saved."}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </Card>
      </SimpleGrid>
    </div>
  );
}
