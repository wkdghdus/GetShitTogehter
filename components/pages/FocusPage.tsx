"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { createId } from "@/lib/defaults";
import { setActivityState, updateFocusContent } from "@/lib/timeline";
import { Button, Card, CardHeader, Field, Input, SectionHeader, Textarea } from "@/components/ui";

const PHASES = [
  { key: "focus-one", label: "Focus block 1", seconds: 45 * 60 },
  { key: "break", label: "Break", seconds: 10 * 60 },
  { key: "focus-two", label: "Focus block 2", seconds: 35 * 60 },
] as const;

const attentionRules = [
  {
    title: "Morning rule",
    copy: "No algorithmic feeds before work. Protect the quiet start of the day from unrelated information.",
  },
  {
    title: "Focus rule",
    copy: "Put your phone across the room or somewhere outside casual reach while the timer is running.",
  },
  {
    title: "Break rule",
    copy: "Skip short-form feeds. Stand, drink water, stretch, look outside, or take a short walk instead.",
  },
  {
    title: "Intentional consumption",
    copy: "Screens are not inherently bad. Free Life can include games, videos, feeds, and entertainment without guilt.",
  },
  {
    title: "Bed rule",
    copy: "Keep the phone out of bed when you can. The goal is protecting sleep, not avoiding technology entirely.",
  },
];

export function FocusPage() {
  const { state, today, todayDate, isHydrated, setState, updateToday } = useAppState();
  const [objective, setObjective] = useState("");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].seconds);
  const [running, setRunning] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [completedText, setCompletedText] = useState("");

  useEffect(() => {
    if (!objective && today?.focusObjective) setObjective(today.focusObjective);
  }, [objective, today?.focusObjective]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1;
        setRunning(false);
        if (phaseIndex < PHASES.length - 1) {
          const nextIndex = phaseIndex + 1;
          setPhaseIndex(nextIndex);
          return PHASES[nextIndex].seconds;
        }
        setFinishing(true);
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phaseIndex, running]);

  const time = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const seconds = (secondsLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [secondsLeft]);

  if (!isHydrated || !state || !today) {
    return <p className="text-[color:var(--muted)]">Loading your focus space…</p>;
  }

  const reset = () => {
    setRunning(false);
    setFinishing(false);
    setCompletedText("");
    setPhaseIndex(0);
    setSecondsLeft(PHASES[0].seconds);
  };

  const skipBreak = () => {
    if (PHASES[phaseIndex].key !== "break") return;
    setRunning(false);
    setPhaseIndex(2);
    setSecondsLeft(PHASES[2].seconds);
  };

  const saveSession = () => {
    const cleanObjective = objective.trim() || today.focusObjective;
    const cleanCompleted = completedText.trim();
    setState((current) => ({
      ...current,
      focusSessions: [
        {
          id: createId("focus-session"),
          date: todayDate,
          objective: cleanObjective,
          completedText: cleanCompleted || undefined,
          completedAt: new Date().toISOString(),
        },
        ...current.focusSessions,
      ],
    }));
    updateToday((entry) => setActivityState(
      {
        ...updateFocusContent(entry, { focusObjective: cleanObjective }),
        focusNote: cleanCompleted || entry.focusNote,
      },
      "focus",
      "completed",
    ));
    reset();
  };

  return (
    <div>
      <SectionHeader
        eyebrow="80 focused minutes"
        title="Focus"
        description="Make working time dense and bounded. When the session ends, your evening opens back up."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <Card className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
            {PHASES[phaseIndex].label}
          </p>
          <div className="my-5 font-mono text-6xl font-bold tabular-nums text-[color:var(--text)] sm:text-7xl">
            {time}
          </div>
          <div className="mx-auto mb-6 grid max-w-lg gap-2 text-left">
            <Field label="Current objective" hint="One objective is enough for this session.">
              <Input
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                placeholder="Complete two-pointer Leetcode review"
                disabled={running}
              />
            </Field>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => setRunning(true)} disabled={running || finishing || !objective.trim()}>
              Start
            </Button>
            <Button variant="secondary" onClick={() => setRunning(false)} disabled={!running}>
              Pause
            </Button>
            <Button variant="ghost" onClick={reset}>Reset</Button>
            <Button variant="secondary" onClick={skipBreak} disabled={PHASES[phaseIndex].key !== "break"}>
              Skip break
            </Button>
            <Button variant="secondary" onClick={() => { setRunning(false); setFinishing(true); }} disabled={finishing}>
              End session
            </Button>
          </div>

          {finishing ? (
            <div className="mx-auto mt-6 max-w-lg rounded-xl bg-[color:var(--surface-muted)] p-4 text-left">
              <Field label="What did you complete?">
                <Textarea
                  value={completedText}
                  onChange={(event) => setCompletedText(event.target.value)}
                  placeholder="A short note is enough."
                />
              </Field>
              <div className="mt-3 flex gap-2">
                <Button onClick={saveSession}>Save and close</Button>
                <Button variant="ghost" onClick={() => setFinishing(false)}>Keep session open</Button>
              </div>
            </div>
          ) : null}
        </Card>

        <Card tone="quiet">
          <CardHeader title="Session shape" description="A clear end is part of the design." />
          <ol className="space-y-3">
            {PHASES.map((phase, index) => (
              <li key={phase.key} className="flex items-center justify-between gap-3 text-sm">
                <span className={index === phaseIndex ? "font-bold text-[color:var(--text)]" : "text-[color:var(--muted)]"}>
                  {index + 1}. {phase.label}
                </span>
                <span>{Math.round(phase.seconds / 60)} min</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-[color:var(--border)] pt-4 text-sm text-[color:var(--muted)]">
            During breaks, let attention settle instead of replacing focused work with a scrolling feed.
          </p>
        </Card>
      </div>

      <section className="mt-8">
        <SectionHeader
          eyebrow="Attention"
          title="Protect the edges of focus"
          description="The aim is intentional attention—not guilt about using screens."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {attentionRules.map((rule) => (
            <Card key={rule.title} tone="quiet">
              <h2 className="font-bold text-[color:var(--text)]">{rule.title}</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{rule.copy}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
