import { addDays, diffDays } from "./dates";
import type {
  CurriculumProblemProgress,
  CurriculumTrackProgress,
  LeetcodeCurriculumProgress,
  LeetcodeDay,
  ProblemAttempt,
  ProblemRating,
} from "./types";

// Source rules: red -> tomorrow, +3d, +1w, +3w · yellow -> +3d, +1w, +3w · green -> 1-2 weeks.
// green has a single rung because retirement fires on the second consecutive green.
export const REVIEW_LADDER: Record<ProblemRating, number[]> = {
  red: [1, 3, 7, 21],
  yellow: [3, 7, 21],
  green: [14],
};

export interface ReviewQueueItem {
  slug: string;
  name: string;
  pattern: string;
  role: "solve" | "study";
  rating: ProblemRating;
  dueOn: string;
  overdueDays: number;
}

export interface PatternConfidence {
  pattern: string;
  red: number;
  yellow: number;
  green: number;
}

export interface TrackSummary<D> {
  total: number;
  completed: number;
  percent: number;
  currentDay: number;
  current: D;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// The `prompt === undefined` clause is load-bearing: without it this also matches
// days 43-48 and 50-56, which carry a free-form assignment but no named problems.
export function isQueueOnlyDay(day: {
  problems: unknown[];
  coldReview: unknown[];
  prompt?: string;
}): boolean {
  return day.problems.length === 0 && day.coldReview.length === 0 && day.prompt === undefined;
}

export function trailingRun(attempts: ProblemAttempt[]): number {
  if (attempts.length === 0) return 0;
  const rating = attempts[attempts.length - 1].rating;
  let run = 0;
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    if (attempts[index].rating !== rating) break;
    run += 1;
  }
  return run;
}

// Stays a pure function of `attempts`: a retired problem still reports its due date,
// because retirement is a queue-membership filter applied in getReviewQueue.
export function reviewDueDate(p: CurriculumProblemProgress): string | undefined {
  if (p.attempts.length === 0) return undefined;
  const last = p.attempts[p.attempts.length - 1];
  const ladder = REVIEW_LADDER[last.rating];
  const offset = ladder[Math.min(trailingRun(p.attempts) - 1, ladder.length - 1)];
  return addDays(last.date, offset);
}

export function isRetired(p: CurriculumProblemProgress): boolean {
  if (p.attempts.length === 0) return false;
  const last = p.attempts[p.attempts.length - 1];
  return last.rating === "green" && trailingRun(p.attempts) >= 2;
}

interface ResolvedProblem {
  name: string;
  pattern: string;
  role: "solve" | "study";
}

function resolveProblems(
  progress: LeetcodeCurriculumProgress,
  days: LeetcodeDay[],
): Map<string, ResolvedProblem> {
  const resolved = new Map<string, ResolvedProblem>();
  for (const day of days) {
    for (const problem of day.problems) {
      if (!resolved.has(problem.slug)) {
        resolved.set(problem.slug, {
          name: problem.name,
          pattern: problem.pattern,
          role: problem.role,
        });
      }
    }
  }
  for (const problem of progress.userProblems) {
    if (!resolved.has(problem.slug)) {
      resolved.set(problem.slug, {
        name: problem.name,
        pattern: problem.pattern ?? "",
        role: "solve",
      });
    }
  }
  return resolved;
}

export function getReviewQueue(
  progress: LeetcodeCurriculumProgress,
  days: LeetcodeDay[],
  today: string,
): ReviewQueueItem[] {
  const resolved = resolveProblems(progress, days);
  const queue: ReviewQueueItem[] = [];

  for (const problem of Object.values(progress.problems)) {
    if (problem.attempts.length === 0 || isRetired(problem)) continue;
    const dueOn = reviewDueDate(problem);
    if (dueOn === undefined) continue;
    const meta = resolved.get(problem.slug);
    queue.push({
      slug: problem.slug,
      name: meta?.name ?? problem.slug,
      pattern: meta?.pattern ?? "",
      role: meta?.role ?? "solve",
      rating: problem.attempts[problem.attempts.length - 1].rating,
      dueOn,
      overdueDays: Math.max(0, diffDays(dueOn, today)),
    });
  }

  return queue.sort((a, b) => {
    if (a.overdueDays !== b.overdueDays) return b.overdueDays - a.overdueDays;
    if (a.dueOn !== b.dueOn) return a.dueOn < b.dueOn ? -1 : 1;
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  });
}

export function getTrackSummary<D extends { dayId: string; day: number }>(
  days: D[],
  progress: Pick<CurriculumTrackProgress, "currentDay" | "days">,
): TrackSummary<D> {
  const total = days.length;
  const completed = days.filter((day) => Boolean(progress.days[day.dayId]?.completedOn)).length;
  const index = Math.min(Math.max(progress.currentDay, 1), total) - 1;
  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    currentDay: progress.currentDay,
    current: days[index],
  };
}

export function patternConfidence(
  progress: LeetcodeCurriculumProgress,
  days: LeetcodeDay[],
): PatternConfidence[] {
  const resolved = resolveProblems(progress, days);
  const tallies = new Map<string, PatternConfidence>();

  // Iterated in content order, then user-problem order, so the result is
  // deterministic rather than dependent on stored key insertion order.
  for (const slug of resolved.keys()) {
    const problem = progress.problems[slug];
    if (!problem || problem.attempts.length === 0) continue;
    const pattern = resolved.get(slug)?.pattern ?? "";
    if (pattern === "") continue;
    let tally = tallies.get(pattern);
    if (!tally) {
      tally = { pattern, red: 0, yellow: 0, green: 0 };
      tallies.set(pattern, tally);
    }
    for (const attempt of problem.attempts) {
      tally[attempt.rating] += 1;
    }
  }

  return [...tallies.values()];
}

export function markDayComplete<P extends CurriculumTrackProgress>(
  progress: P,
  dayId: string,
  date: string,
): P {
  const existing = progress.days[dayId];
  if (existing?.completedOn) return progress;
  return {
    ...progress,
    days: { ...progress.days, [dayId]: { ...existing, completedOn: date } },
  };
}

export function setCurrentDay<P extends CurriculumTrackProgress>(
  progress: P,
  day: number,
  maxDay: number,
): P {
  return { ...progress, currentDay: Math.min(Math.max(day, 1), maxDay) };
}

export function logAttempt(
  progress: LeetcodeCurriculumProgress,
  slug: string,
  date: string,
  rating: ProblemRating,
): LeetcodeCurriculumProgress {
  const existing = progress.problems[slug];
  return {
    ...progress,
    problems: {
      ...progress.problems,
      [slug]: {
        ...existing,
        slug,
        attempts: [...(existing?.attempts ?? []), { date, rating }],
      },
    },
  };
}

export function addUserProblem(
  progress: LeetcodeCurriculumProgress,
  name: string,
  pattern: string,
  date: string,
): LeetcodeCurriculumProgress {
  const slug = slugify(name);
  if (progress.userProblems.some((problem) => problem.slug === slug)) return progress;
  return {
    ...progress,
    userProblems: [...progress.userProblems, { slug, name, pattern, addedOn: date }],
  };
}
