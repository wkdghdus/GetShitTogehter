"use client";

import { useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { getWeekStart, parseLocalDate, getLocalDate } from "@/lib/dates";
import type { WeekReview } from "@/lib/types";
import { Badge, Button, Card, CardHeader, CheckboxRow, Field, Input, SectionHeader, SimpleGrid, Textarea } from "@/components/ui";

function getWeekEnd(start: string) {
  const value = parseLocalDate(start); value.setDate(value.getDate() + 6); return getLocalDate(value);
}

export function WeeklyReviewPage() {
  const { state, todayDate, isHydrated, setState } = useAppState();
  const [saved, setSaved] = useState(false);
  if (!isHydrated || !state) return <p className="text-[color:var(--muted)]">Loading weekly review…</p>;
  const weekStart = getWeekStart(todayDate); const weekEnd = getWeekEnd(weekStart); const review = state.weeklyReviews[weekStart];
  if (!review) return <p className="text-[color:var(--muted)]">Preparing this week…</p>;

  const updateReview = (updater: (current: WeekReview) => WeekReview) => setState((current) => ({ ...current, weeklyReviews: { ...current.weeklyReviews, [weekStart]: updater(current.weeklyReviews[weekStart]) } }));
  const updatePriority = (index: number, patch: { text?: string; completed?: boolean }) => updateReview((current) => {
    const priorities: WeekReview["priorities"] = [...current.priorities]; priorities[index] = { ...priorities[index], ...patch }; return { ...current, priorities };
  });
  const inWeek = (date?: string) => Boolean(date && date >= weekStart && date <= weekEnd);
  const stats = [
    ["Physical sessions", Object.values(state.dailyEntries).filter((entry) => inWeek(entry.date) && entry.physicalCompleted).length],
    ["Focus sessions", state.focusSessions.filter((entry) => inWeek(entry.date)).length],
    ["Applications submitted", state.applications.filter((entry) => inWeek(entry.dateApplied) && entry.status !== "saved").length],
    ["Project milestones", state.projects.filter((entry) => inWeek(entry.completedAt?.slice(0, 10))).length],
    ["Leetcode sessions", state.leetcodeEntries.filter((entry) => inWeek(entry.datePracticed)).length],
    ["System design sessions", state.systemDesignEntries.filter((entry) => inWeek(entry.lastStudied)).length],
  ] as const;

  return <div>
    <SectionHeader eyebrow={`Week of ${weekStart}`} title="Weekly Review" description="Learn from the week without grading yourself. Three outcomes keep everything else secondary." action={saved ? <Badge tone="success">Saved locally</Badge> : undefined} />
    <Card className="mb-8">
      <CardHeader title="This Week's Three Outcomes" description="Exactly three major outcomes—there is intentionally no fourth slot." />
      <div className="space-y-3">{review.priorities.map((priority, index) => <div key={priority.id} className="grid gap-2 rounded-xl border border-[color:var(--border)] bg-white p-3 sm:grid-cols-[2rem_minmax(0,1fr)_14rem] sm:items-center"><span className="text-lg font-bold text-[color:var(--accent)]">{index + 1}</span><Input value={priority.text} onChange={(event) => { setSaved(false); updatePriority(index, { text: event.target.value }); }} placeholder={index === 0 ? "Submit 12 thoughtful applications" : index === 1 ? "Ship one project milestone" : "Complete school PM milestone"} aria-label={`Weekly outcome ${index + 1}`} /><CheckboxRow label="Outcome complete" checked={priority.completed} onChange={(event) => { setSaved(false); updatePriority(index, { completed: event.target.checked }); }} /></div>)}</div>
    </Card>
    <SimpleGrid className="mb-8 xl:grid-cols-2">
      <Field label="What went well this week?"><Textarea value={review.wentWell} onChange={(event) => { setSaved(false); updateReview((current) => ({ ...current, wentWell: event.target.value })); }} /></Field>
      <Field label="What created friction?"><Textarea value={review.friction} onChange={(event) => { setSaved(false); updateReview((current) => ({ ...current, friction: event.target.value })); }} /></Field>
      <Field label="What did I repeatedly avoid?"><Textarea value={review.avoided} onChange={(event) => { setSaved(false); updateReview((current) => ({ ...current, avoided: event.target.value })); }} /></Field>
      <Field label="What should change next week?"><Textarea value={review.changeNextWeek} onChange={(event) => { setSaved(false); updateReview((current) => ({ ...current, changeNextWeek: event.target.value })); }} /></Field>
    </SimpleGrid>
    <Button className="mb-8" onClick={() => setSaved(true)}>Finish weekly review</Button>
    <section><SectionHeader eyebrow="Lightweight signals" title="This week's activity" description="These numbers support reflection; they are not a score." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{stats.map(([name, value]) => <Card key={name} tone="quiet"><p className="text-sm text-[color:var(--muted)]">{name}</p><p className="mt-2 text-3xl font-bold">{value}</p></Card>)}</div></section>
  </div>;
}
