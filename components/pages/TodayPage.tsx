"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { createId } from "@/lib/defaults";
import { formatDisplayDate, getWeekStart, isWeekend } from "@/lib/dates";
import type { DailyEntry, MentalLoadArea } from "@/lib/types";
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
  if (entry.lowEnergyMode) {
    const lowEnergyProgress =
      Number(entry.physicalCompleted) + Number(entry.focusCompleted) + Number(entry.lifeCheckIns.length > 0);

    return {
      title: "Low Energy Day",
      description:
        lowEnergyProgress >= 2
          ? "Reduced intensity still counts. Keep the day small and closed."
          : "A low-energy day is not a failed day. Pick the smallest useful next action.",
      tone: "warning" as const,
      completed: lowEnergyProgress,
      total: 3,
    };
  }

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
  if (entry.lowEnergyMode) return "Low Energy";
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
  const weekStart = getWeekStart(todayDate);
  const weekReview = state.weeklyReviews[weekStart];
  const weeklyOutcomes = weekReview?.priorities ?? [];
  const wins = getWins(today);
  const weekend = isWeekend(today.date);
  const activeProject = today.focusCategory === "project"
    ? state.projects.find((project) => project.status === "active")
    : undefined;

  const saveFocus = () => {
    updateToday((entry) => ({
      ...entry,
      focusLabel: focusLabel.trim() || entry.focusLabel,
      focusObjective: focusObjective.trim() || entry.focusObjective,
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

      <Card tone={dayStatus.tone === "success" ? "success" : "quiet"} className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--text)]">{dayStatus.title}</h2>
            <p className="mt-1 text-[color:var(--muted)]">{dayStatus.description}</p>
          </div>
          <Button
            variant={today.lowEnergyMode ? "secondary" : "ghost"}
            onClick={() =>
              updateToday((entry) => ({
                ...entry,
                lowEnergyMode: !entry.lowEnergyMode,
                lowEnergyChoice: !entry.lowEnergyMode ? entry.lowEnergyChoice : undefined,
              }))
            }
          >
            {today.lowEnergyMode ? "Use normal day" : "Low Energy Day"}
          </Button>
        </div>
      </Card>

      <SimpleGrid>
        <Card tone={wins.body ? "success" : "default"}>
          <CardHeader title="Body" description="Morning physical activity is the physical win." />
          <p className="text-2xl font-bold text-[color:var(--text)]">{today.physicalLabel}</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">{timeRange(today.physicalStart, today.physicalEnd)}</p>
          <CheckboxRow
            className="mt-5"
            label="Completed"
            description={today.physicalType === "rest" ? "Rest counts as following the plan." : undefined}
            checked={today.physicalCompleted}
            onChange={(event) => updateToday((entry) => ({ ...entry, physicalCompleted: event.target.checked }))}
          />
        </Card>

        <Card tone={wins.work ? "success" : "default"}>
          <CardHeader
            title="Work"
            description={weekend ? "Weekends do not require the 9-5 workday condition." : "Keep this simple."}
          />
          <p className="text-2xl font-bold text-[color:var(--text)]">{weekend ? "No workday required" : `${state.settings.workStart} - ${state.settings.workEnd}`}</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            This dashboard is not a work task manager.
          </p>
          <CheckboxRow
            className="mt-5"
            label="Workday complete"
            checked={today.workCompleted}
            disabled={weekend}
            onChange={(event) => updateToday((entry) => ({ ...entry, workCompleted: event.target.checked }))}
          />
        </Card>

        <Card tone={wins.future ? "success" : "default"}>
          <CardHeader title="Future" description="Exactly one primary evening objective." />
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
            <Button variant="secondary" onClick={() => updateToday((entry) => ({ ...entry, focusCompleted: true }))}>
              Mark Complete
            </Button>
            <Button variant="ghost" onClick={() => updateToday((entry) => ({ ...entry, focusCompleted: false }))}>
              Reopen
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

      {today.lowEnergyMode ? (
        <Card className="mt-5" tone="quiet">
          <CardHeader
            title="Low Energy Day"
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
          title="Today's timeline"
          description="A chronological shape for the day. These are boundaries and reminders, not another checklist."
        />
        <Card>
          <ol className="space-y-4">
            {today.timeline.map((item) => (
              <li key={item.id} className="grid gap-3 border-b border-[color:var(--border)] pb-4 last:border-0 last:pb-0 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
                <p className="font-mono text-sm font-bold text-[color:var(--muted)]">{timeRange(item.start, item.end)}</p>
                <div>
                  <h3 className="font-bold text-[color:var(--text)]">{item.title}</h3>
                  {item.description ? <p className="text-sm text-[color:var(--muted)]">{item.description}</p> : null}
                </div>
                <TimelineKindBadge kind={item.kind} />
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
            description={`${state.settings.freeLifeStart} - ${state.settings.freeLifeEnd}. This is part of the routine.`}
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
            description={`${state.settings.freeLifeEnd} is the default cue to close the day.`}
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
