"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { getTrackSummary, markDayComplete, setCurrentDay } from "@/lib/curriculum";
import { SYSTEM_DESIGN_DAYS, SYSTEM_DESIGN_RESOURCES, SYSTEM_DESIGN_WEEKS } from "@/lib/curricula/system-design";
import { CurriculumTrackNav } from "@/components/CurriculumTrackNav";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  cn,
  EmptyState,
  Field,
  ProgressBar,
  SectionHeader,
  Textarea,
} from "@/components/ui";

const TOTAL_DAYS = SYSTEM_DESIGN_DAYS.length;

export function SystemDesignCurriculumPage() {
  const { state, todayDate, isHydrated, setState } = useAppState();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [noteDayId, setNoteDayId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const progress = state?.systemDesignCurriculum;
  const summary = useMemo(() => {
    if (!progress) return null;
    return getTrackSummary(SYSTEM_DESIGN_DAYS, progress);
  }, [progress]);
  const currentDay = summary?.current;

  useEffect(() => {
    if (!progress || !currentDay || noteDayId === currentDay.dayId) return;
    setNoteDayId(currentDay.dayId);
    setNoteDraft(progress.days[currentDay.dayId]?.note ?? "");
  }, [currentDay, noteDayId, progress]);

  if (!isHydrated || !state || !progress || !summary || !currentDay) {
    return <p className="text-[color:var(--muted)]">Loading system design curriculum…</p>;
  }

  if (!progress.startedOn) {
    return (
      <div>
        <CurriculumTrackNav />
        <SectionHeader
          eyebrow="28 days, 60-75 min/day"
          title="System Design"
          description="Learn the vocabulary and building blocks first, then switch to solve-first practice on classic and hard interview problems."
        />
        <EmptyState
          title="Start the 28-day track"
          description="Day 1 covers what system design interviews test and how to gather requirements — no architecture yet."
          action={
            <Button
              onClick={() =>
                setState((current) => ({
                  ...current,
                  systemDesignCurriculum: { ...current.systemDesignCurriculum, startedOn: todayDate, currentDay: 1 },
                }))
              }
            >
              Start Day 1
            </Button>
          }
        />
      </div>
    );
  }

  const currentWeek = SYSTEM_DESIGN_WEEKS.find((week) => week.week === currentDay.week);
  const phaseLabel = currentDay.mode === "learn" ? "Learn mode" : "Solve-first mode";
  const isLastDay = currentDay.day >= TOTAL_DAYS;

  const handleMarkComplete = () => {
    setState((current) => ({
      ...current,
      systemDesignCurriculum: markDayComplete(current.systemDesignCurriculum, currentDay.dayId, todayDate),
    }));
  };

  const handleAdvance = () => {
    setState((current) => ({
      ...current,
      systemDesignCurriculum: setCurrentDay(current.systemDesignCurriculum, current.systemDesignCurriculum.currentDay + 1, TOTAL_DAYS),
    }));
  };

  const handleJumpToDay = (day: number) => {
    setState((current) => ({
      ...current,
      systemDesignCurriculum: setCurrentDay(current.systemDesignCurriculum, day, TOTAL_DAYS),
    }));
  };

  const handleSaveNote = () => {
    setState((current) => {
      const existing = current.systemDesignCurriculum.days[currentDay.dayId];
      const trimmed = noteDraft.trim();
      return {
        ...current,
        systemDesignCurriculum: {
          ...current.systemDesignCurriculum,
          days: {
            ...current.systemDesignCurriculum.days,
            [currentDay.dayId]: { ...existing, note: trimmed || undefined },
          },
        },
      };
    });
  };

  const isCompleted = (dayId: string) => Boolean(progress.days[dayId]?.completedOn);

  return (
    <div>
      <CurriculumTrackNav />
      <SectionHeader
        eyebrow="28 days, 60-75 min/day"
        title="System Design"
        description="Learn the vocabulary and building blocks first, then switch to solve-first practice on classic and hard interview problems."
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[color:var(--text)]">
              Week {currentWeek?.week}: {currentWeek?.title}
            </p>
            {currentWeek ? <p className="mt-1 text-sm text-[color:var(--muted)]">{currentWeek.intent}</p> : null}
          </div>
          <Badge tone={currentDay.mode === "learn" ? "neutral" : "accent"}>{phaseLabel}</Badge>
        </div>
        <ProgressBar
          className="mt-4"
          value={summary.completed}
          max={summary.total}
          label={`${summary.completed} / ${summary.total} days complete`}
        />
      </Card>

      <Card className="mb-6">
        <CardHeader
          title={`Day ${currentDay.day}: ${currentDay.title}`}
          description={`Week ${currentDay.week} · ${phaseLabel}`}
          action={isCompleted(currentDay.dayId) ? <Badge tone="success">Completed</Badge> : undefined}
        />

        <div>
          <p className="text-sm font-bold text-[color:var(--text)]">Learn</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[color:var(--muted)]">
            {currentDay.learn.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {currentDay.exercise ? (
          <div className="mt-4">
            <p className="text-sm font-bold text-[color:var(--text)]">Exercise</p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">{currentDay.exercise}</p>
          </div>
        ) : null}

        {currentDay.helloInterview || currentDay.alexXu ? (
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
            {currentDay.helloInterview ? <span>Hello Interview: {currentDay.helloInterview}</span> : null}
            {currentDay.alexXu ? <span>Alex Xu: {currentDay.alexXu}</span> : null}
          </div>
        ) : null}

        {currentDay.caution ? (
          <p className="mt-4 rounded-lg border border-[#dfcca0] bg-[#fff8e5] p-3 text-sm font-bold text-[color:var(--warning)]">
            {currentDay.caution}
          </p>
        ) : null}

        <div className="mt-5">
          <Field label="Day note">
            <Textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="What clicked, what didn't, what to revisit."
            />
          </Field>
          <div className="mt-2">
            <Button variant="secondary" onClick={handleSaveNote}>
              Save note
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={handleMarkComplete} disabled={isCompleted(currentDay.dayId)}>
            {isCompleted(currentDay.dayId) ? "Day complete" : "Mark day complete"}
          </Button>
          <Button variant="secondary" onClick={handleAdvance} disabled={isLastDay}>
            {isLastDay ? "Final day" : `Advance to Day ${currentDay.day + 1}`}
          </Button>
        </div>
      </Card>

      <section className="mb-6">
        <SectionHeader title="All 28 days" className="mb-3" />
        <div className="space-y-3">
          {SYSTEM_DESIGN_WEEKS.map((week) => {
            const isOpen = expandedWeek === week.week;
            const days = SYSTEM_DESIGN_DAYS.filter((day) => day.week === week.week);
            return (
              <Card key={week.week} tone="quiet">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => setExpandedWeek(isOpen ? null : week.week)}
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-[color:var(--text)]">
                    Week {week.week}: {week.title}
                  </span>
                  <span className="text-sm text-[color:var(--muted)]">{isOpen ? "Hide" : "Show"}</span>
                </button>
                {isOpen ? (
                  <ul className="mt-4 space-y-1">
                    {days.map((day) => (
                      <li key={day.dayId}>
                        <button
                          type="button"
                          onClick={() => handleJumpToDay(day.day)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[color:var(--surface-muted)]",
                            day.dayId === currentDay.dayId ? "bg-[color:var(--surface-muted)] font-bold" : "",
                          )}
                        >
                          <span>
                            Day {day.day}: {day.title}
                          </span>
                          {isCompleted(day.dayId) ? <Badge tone="success">✓ Done</Badge> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Resource stack" title="What to use, and when" className="mb-3" />
        <div className="grid gap-3 md:grid-cols-2">
          {SYSTEM_DESIGN_RESOURCES.map((resource) => (
            <Card key={resource.name} tone="quiet">
              <p className="font-bold text-[color:var(--text)]">
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[color:var(--primary)] underline underline-offset-2"
                  >
                    {resource.name}
                  </a>
                ) : (
                  resource.name
                )}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{resource.note}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
