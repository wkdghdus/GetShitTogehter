"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useAppState } from "@/context/app-state-context";
import { diffDays } from "@/lib/dates";
import {
  addUserProblem,
  getReviewQueue,
  getTrackSummary,
  isQueueOnlyDay,
  logAttempt,
  markDayComplete,
  patternConfidence,
  setCurrentDay,
  slugify,
} from "@/lib/curriculum";
import { LEETCODE_DAYS, LEETCODE_PATTERN_CLUES, LEETCODE_RESOURCES, LEETCODE_WEEKS } from "@/lib/curricula/leetcode";
import type { ProblemRating } from "@/lib/types";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, ProgressBar, SectionHeader, Select, cn } from "@/components/ui";
import { CurriculumTrackNav } from "@/components/CurriculumTrackNav";

const PROBLEM_INDEX = new Map<string, { name: string; pattern: string }>();
for (const contentDay of LEETCODE_DAYS) {
  for (const problem of contentDay.problems) {
    if (!PROBLEM_INDEX.has(problem.slug)) {
      PROBLEM_INDEX.set(problem.slug, { name: problem.name, pattern: problem.pattern });
    }
  }
}

const RATING_STYLES: Record<ProblemRating, string> = {
  red: "border-[#b98d82] bg-[#fff4f1] text-[#7a3026]",
  yellow: "border-[#dfcca0] bg-[#fff8e5] text-[color:var(--warning)]",
  green: "border-[#b8d1c3] bg-[#edf6f0] text-[color:var(--success)]",
};

const RATING_LABEL: Record<ProblemRating, string> = { red: "Red", yellow: "Yellow", green: "Green" };

const SOLVE_LOOP = [
  {
    stage: "1. Understand",
    copy: "2-3 min. Inputs, output, constraints, brute-force shape, what information you repeatedly need. Don't immediately type.",
  },
  {
    stage: "2. Attempt",
    copy: "~15-20 min. Derive something, use examples, draw it, write brute force. Checking the solution after 15-20 minutes of no progress is normal, not cheating.",
  },
  { stage: "3. Study", copy: "Don't copy the code. Understand why it works. Then close the solution." },
  { stage: "4. Reconstruct", copy: "Start from a blank function signature and implement it yourself. If you can't, you didn't learn it yet." },
  { stage: "5. Explain", copy: "Narrate the brute force, the optimization, and the resulting time/space complexity out loud before finishing." },
];

function RatingBadge({ rating }: { rating: ProblemRating }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold", RATING_STYLES[rating])}>
      {RATING_LABEL[rating]}
    </span>
  );
}

function RatingButtons({ slug, onRate }: { slug: string; onRate: (slug: string, rating: ProblemRating) => void }) {
  return (
    <div className="flex gap-1.5">
      <Button type="button" variant="secondary" className="px-2.5 py-1" aria-label="Rate red" onClick={() => onRate(slug, "red")}>🔴</Button>
      <Button type="button" variant="secondary" className="px-2.5 py-1" aria-label="Rate yellow" onClick={() => onRate(slug, "yellow")}>🟡</Button>
      <Button type="button" variant="secondary" className="px-2.5 py-1" aria-label="Rate green" onClick={() => onRate(slug, "green")}>🟢</Button>
    </div>
  );
}

function dueLabel(dueOn: string, todayDate: string, overdueDays: number): string {
  if (overdueDays > 0) return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
  const untilDue = diffDays(todayDate, dueOn);
  if (untilDue <= 0) return "due today";
  return `due in ${untilDue} day${untilDue === 1 ? "" : "s"}`;
}

export function LeetcodeCurriculumPage() {
  const { state, todayDate, isHydrated, setState } = useAppState();

  if (!isHydrated || !state) return <p className="text-[color:var(--muted)]">Loading your LeetCode curriculum…</p>;

  const progress = state.leetcodeCurriculum;

  const startCurriculum = () => setState((current) => ({
    ...current,
    leetcodeCurriculum: { ...current.leetcodeCurriculum, startedOn: todayDate },
  }));

  if (!progress.startedOn) {
    return (
      <div>
        <SectionHeader eyebrow="8 weeks, 75-90 min/day" title="LeetCode" description="A fixed NeetCode-150 syllabus with spaced-repetition review baked in." />
        <CurriculumTrackNav />
        <EmptyState
          title="Start the LeetCode curriculum"
          description="56 days across 8 weeks. Once started, Day 1 becomes your current day and the review queue starts tracking every rated problem."
          action={<Button onClick={startCurriculum}>Start Day 1</Button>}
        />
      </div>
    );
  }

  const summary = getTrackSummary(LEETCODE_DAYS, progress);
  const currentDay = summary.current;
  const currentWeek = LEETCODE_WEEKS.find((week) => week.week === currentDay.week);
  const queue = getReviewQueue(progress, LEETCODE_DAYS, todayDate);
  const confidence = patternConfidence(progress, LEETCODE_DAYS);
  const dayCompleted = Boolean(progress.days[currentDay.dayId]?.completedOn);
  const queueOnly = isQueueOnlyDay(currentDay);

  const attemptedProblems = Object.values(progress.problems).filter((problem) => problem.attempts.length > 0);
  const tallies = { red: 0, yellow: 0, green: 0 };
  for (const problem of attemptedProblems) {
    tallies[problem.attempts[problem.attempts.length - 1].rating] += 1;
  }

  const rate = (slug: string, rating: ProblemRating) => setState((current) => ({
    ...current,
    leetcodeCurriculum: logAttempt(current.leetcodeCurriculum, slug, todayDate, rating),
  }));

  const patchKeyInsight = (slug: string, keyInsight: string) => setState((current) => {
    const existing = current.leetcodeCurriculum.problems[slug];
    return {
      ...current,
      leetcodeCurriculum: {
        ...current.leetcodeCurriculum,
        problems: {
          ...current.leetcodeCurriculum.problems,
          [slug]: { ...existing, slug, attempts: existing?.attempts ?? [], keyInsight },
        },
      },
    };
  });

  const completeDay = () => setState((current) => ({
    ...current,
    leetcodeCurriculum: markDayComplete(current.leetcodeCurriculum, currentDay.dayId, todayDate),
  }));

  const advanceDay = () => setState((current) => ({
    ...current,
    leetcodeCurriculum: setCurrentDay(current.leetcodeCurriculum, current.leetcodeCurriculum.currentDay + 1, LEETCODE_DAYS.length),
  }));

  const addSolvedProblem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    const data = new FormData(element);
    const name = String(data.get("name") ?? "").trim();
    if (!name) return;
    const pattern = String(data.get("pattern") ?? "").trim();
    const rating = String(data.get("rating") ?? "green") as ProblemRating;
    const slug = slugify(name);
    setState((current) => {
      const withProblem = addUserProblem(current.leetcodeCurriculum, name, pattern, todayDate);
      return { ...current, leetcodeCurriculum: logAttempt(withProblem, slug, todayDate, rating) };
    });
    element.reset();
  };

  return (
    <div>
      <SectionHeader eyebrow="8 weeks, 75-90 min/day" title="LeetCode" description="A fixed NeetCode-150 syllabus with spaced-repetition review baked in." />
      <CurriculumTrackNav />

      <Card className="mb-6">
        <ProgressBar value={summary.completed} max={summary.total} label="Days completed" />
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[color:var(--muted)]">
          <span><strong className="text-[color:var(--text)]">{attemptedProblems.length}</strong> problems attempted</span>
          <span className="flex items-center gap-1.5"><RatingBadge rating="red" /> {tallies.red}</span>
          <span className="flex items-center gap-1.5"><RatingBadge rating="yellow" /> {tallies.yellow}</span>
          <span className="flex items-center gap-1.5"><RatingBadge rating="green" /> {tallies.green}</span>
        </div>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Review queue" description="This is the whole point of the tracker. Overdue problems come first." />
        {queue.length === 0 ? (
          <EmptyState title="Nothing due" description="Rate a problem and it will show up here on its next scheduled review." />
        ) : (
          <div className="space-y-2">
            {queue.map((item) => (
              <div key={item.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
                <div>
                  <p className="font-bold text-[color:var(--text)]">{item.name}</p>
                  <p className="text-sm text-[color:var(--muted)]">{item.pattern || "—"} · {dueLabel(item.dueOn, todayDate, item.overdueDays)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <RatingBadge rating={item.rating} />
                  <RatingButtons slug={item.slug} onRate={rate} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <CardHeader
          title={`Day ${currentDay.day} · ${currentDay.title}`}
          description={currentWeek ? `Week ${currentWeek.week}: ${currentWeek.title}` : undefined}
          action={dayCompleted ? <Badge tone="success">Completed</Badge> : <Button onClick={completeDay}>Mark day complete</Button>}
        />

        {currentDay.learn.length > 0 ? (
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[color:var(--text)]">
            {currentDay.learn.map((line) => <li key={line}>{line}</li>)}
          </ul>
        ) : null}

        {queueOnly ? (
          <p className="rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm font-bold text-[color:var(--text)]">
            No new problems today — work the review queue above.
          </p>
        ) : (
          <>
            {currentDay.problems.length > 0 ? (
              <div className="space-y-3">
                {currentDay.problems.map((problem) => {
                  const stored = progress.problems[problem.slug];
                  const lastRating = stored && stored.attempts.length > 0
                    ? stored.attempts[stored.attempts.length - 1].rating
                    : undefined;
                  return (
                    <div key={problem.slug} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-[color:var(--text)]">
                            {problem.name}
                            {problem.role === "study" ? <Badge tone="accent" className="ml-2">study</Badge> : null}
                          </p>
                          <p className="text-sm text-[color:var(--muted)]">{problem.pattern}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {lastRating ? <RatingBadge rating={lastRating} /> : null}
                          <RatingButtons slug={problem.slug} onRate={rate} />
                        </div>
                      </div>
                      <Field label="Key insight" className="mt-3">
                        <Input
                          value={stored?.keyInsight ?? ""}
                          onChange={(event) => patchKeyInsight(problem.slug, event.target.value)}
                          placeholder="Store complement in a hash map…"
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {currentDay.prompt ? (
              <p className="mt-4 rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm font-bold text-[color:var(--text)]">
                {currentDay.prompt}
              </p>
            ) : null}
          </>
        )}

        {currentDay.coldReview.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-sm font-bold text-[color:var(--text)]">Redo cold, then rate again</p>
            <div className="space-y-2">
              {currentDay.coldReview.map((slug) => {
                const meta = PROBLEM_INDEX.get(slug);
                return (
                  <div key={slug} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] p-3">
                    <div>
                      <p className="font-bold text-[color:var(--text)]">{meta?.name ?? slug}</p>
                      <p className="text-sm text-[color:var(--muted)]">{meta?.pattern}</p>
                    </div>
                    <RatingButtons slug={slug} onRate={rate} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {currentDay.prompt !== undefined ? (
          <form onSubmit={addSolvedProblem} className="mt-4 grid gap-3 rounded-lg border border-dashed border-[color:var(--border-strong)] p-4 sm:grid-cols-4">
            <Field label="Add a problem I solved today" className="sm:col-span-2"><Input name="name" placeholder="Problem name" required /></Field>
            <Field label="Pattern"><Input name="pattern" placeholder="e.g. Sliding Window" /></Field>
            <Field label="Result">
              <Select name="rating" defaultValue="green">
                <option value="red">Red</option>
                <option value="yellow">Yellow</option>
                <option value="green">Green</option>
              </Select>
            </Field>
            <div className="sm:col-span-4"><Button type="submit">Log it</Button></div>
          </form>
        ) : null}

        <div className="mt-4">
          <Button variant="secondary" onClick={advanceDay} disabled={summary.currentDay >= summary.total}>
            Advance to Day {summary.currentDay + 1}
          </Button>
        </div>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Pattern confidence" description="Where your reds and yellows cluster — this is the Day 51 weakest-topic view." />
        {confidence.length === 0 ? (
          <EmptyState title="No ratings yet" description="Rate a few problems to see pattern-level confidence." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] text-left text-[color:var(--muted)]">
                  <th className="py-2 pr-4">Pattern</th>
                  <th className="py-2 pr-4">🔴</th>
                  <th className="py-2 pr-4">🟡</th>
                  <th className="py-2 pr-4">🟢</th>
                </tr>
              </thead>
              <tbody>
                {confidence.map((row) => (
                  <tr key={row.pattern} className="border-b border-[color:var(--border)]">
                    <td className="py-2 pr-4 font-bold text-[color:var(--text)]">{row.pattern}</td>
                    <td className="py-2 pr-4">{row.red}</td>
                    <td className="py-2 pr-4">{row.yellow}</td>
                    <td className="py-2 pr-4">{row.green}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Clue → pattern" description="Recognize the shape before reaching for a specific algorithm." />
          <ul className="space-y-1.5 text-sm">
            {LEETCODE_PATTERN_CLUES.map((row) => (
              <li key={row.clue} className="flex justify-between gap-3">
                <span className="text-[color:var(--muted)]">{row.clue}</span>
                <span className="font-bold text-[color:var(--text)]">{row.pattern}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Your 5-stage loop" description="Every new problem, in order." />
          <ol className="space-y-3 text-sm">
            {SOLVE_LOOP.map((stage) => (
              <li key={stage.stage}>
                <p className="font-bold text-[color:var(--text)]">{stage.stage}</p>
                <p className="text-[color:var(--muted)]">{stage.copy}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader title="Resource stack" />
        <ul className="space-y-2 text-sm">
          {LEETCODE_RESOURCES.map((resource) => (
            <li key={resource.name}>
              {resource.url ? (
                <a href={resource.url} target="_blank" rel="noreferrer" className="font-bold text-[color:var(--primary)] underline">
                  {resource.name}
                </a>
              ) : (
                <span className="font-bold text-[color:var(--text)]">{resource.name}</span>
              )}
              <span className="text-[color:var(--muted)]"> — {resource.note}</span>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-sm text-[color:var(--muted)]">
        Logging something outside the curriculum? <Link href="/career" className="font-bold text-[color:var(--primary)] underline">Go to the Career log</Link>.
      </p>
    </div>
  );
}
