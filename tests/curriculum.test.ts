import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REVIEW_LADDER,
  addUserProblem,
  getReviewQueue,
  getTrackSummary,
  isQueueOnlyDay,
  isRetired,
  logAttempt,
  markDayComplete,
  patternConfidence,
  reviewDueDate,
  setCurrentDay,
  slugify,
  trailingRun,
} from "../lib/curriculum";
import type {
  CurriculumProblemProgress,
  LeetcodeCurriculumProgress,
  LeetcodeDay,
  ProblemAttempt,
  ProblemRating,
} from "../lib/types";

// Every date in this suite is a literal. Nothing here may read the wall clock.
const DAY_1 = "2026-09-15";
const DAY_2 = "2026-09-16";
const DAY_5 = "2026-09-19";
const DAY_12 = "2026-09-26";
const DAY_15 = "2026-09-29";

function attempt(date: string, rating: ProblemRating): ProblemAttempt {
  return { date, rating };
}

function problem(slug: string, attempts: ProblemAttempt[]): CurriculumProblemProgress {
  return { slug, attempts };
}

function leetcodeDay(day: number, problems: LeetcodeDay["problems"]): LeetcodeDay {
  return {
    dayId: `lc-d${String(day).padStart(2, "0")}`,
    day,
    week: Math.ceil(day / 7),
    title: `Day ${day}`,
    learn: [],
    problems,
    coldReview: [],
  };
}

function leetcodeProgress(
  problems: CurriculumProblemProgress[],
  userProblems: LeetcodeCurriculumProgress["userProblems"] = [],
): LeetcodeCurriculumProgress {
  return {
    trackId: "leetcode",
    contentVersion: 1,
    currentDay: 1,
    days: {},
    problems: Object.fromEntries(problems.map((p) => [p.slug, p])),
    userProblems,
  };
}

describe("review ladder", () => {
  it("matches the source rules", () => {
    assert.deepEqual(REVIEW_LADDER, {
      red: [1, 3, 7, 21],
      yellow: [3, 7, 21],
      green: [14],
    });
  });
});

// One test case per row of the plan's D4 verification table. The offsets are
// driven by the trailing run of the CURRENT rating, never by the total count.
describe("review scheduling — D4 verification table", () => {
  it("red -> tomorrow", () => {
    const p = problem("two-sum", [attempt(DAY_1, "red")]);
    assert.equal(trailingRun(p.attempts), 1);
    assert.equal(reviewDueDate(p), "2026-09-16");
    assert.equal(isRetired(p), false);
  });

  it("yellow -> +3d", () => {
    const p = problem("two-sum", [attempt(DAY_1, "yellow")]);
    assert.equal(reviewDueDate(p), "2026-09-18");
    assert.equal(isRetired(p), false);
  });

  it("green -> +14d and NOT retired", () => {
    const p = problem("two-sum", [attempt(DAY_1, "green")]);
    assert.equal(trailingRun(p.attempts), 1);
    assert.equal(reviewDueDate(p), "2026-09-29");
    assert.equal(isRetired(p), false);
  });

  it("green, green -> retired, still +14d from the last attempt", () => {
    const p = problem("two-sum", [attempt(DAY_1, "green"), attempt(DAY_15, "green")]);
    assert.equal(trailingRun(p.attempts), 2);
    assert.equal(isRetired(p), true);
    assert.equal(reviewDueDate(p), "2026-10-13");
  });

  it("red, red, red -> +1, +3, +7", () => {
    const first = problem("two-sum", [attempt(DAY_1, "red")]);
    assert.equal(reviewDueDate(first), "2026-09-16");

    const second = problem("two-sum", [attempt(DAY_1, "red"), attempt(DAY_2, "red")]);
    assert.equal(trailingRun(second.attempts), 2);
    assert.equal(reviewDueDate(second), "2026-09-19");

    const third = problem("two-sum", [
      attempt(DAY_1, "red"),
      attempt(DAY_2, "red"),
      attempt(DAY_5, "red"),
    ]);
    assert.equal(trailingRun(third.attempts), 3);
    assert.equal(reviewDueDate(third), "2026-09-26");
  });

  it("red -> yellow is due +3d, not +7d (AC 21)", () => {
    const p = problem("two-sum", [attempt(DAY_1, "red"), attempt(DAY_2, "yellow")]);
    assert.equal(trailingRun(p.attempts), 1);
    assert.equal(reviewDueDate(p), "2026-09-19");
    assert.notEqual(reviewDueDate(p), "2026-09-23");
  });

  it("red, red, red -> yellow is due +3d, not +21d (AC 22)", () => {
    const p = problem("two-sum", [
      attempt(DAY_1, "red"),
      attempt(DAY_2, "red"),
      attempt(DAY_5, "red"),
      attempt(DAY_12, "yellow"),
    ]);
    assert.equal(trailingRun(p.attempts), 1);
    assert.equal(reviewDueDate(p), "2026-09-29");
    assert.notEqual(reviewDueDate(p), "2026-10-17");
  });

  it("green -> red is due tomorrow (AC 23)", () => {
    const p = problem("two-sum", [attempt(DAY_1, "green"), attempt(DAY_15, "red")]);
    assert.equal(trailingRun(p.attempts), 1);
    assert.equal(reviewDueDate(p), "2026-09-30");
    assert.equal(isRetired(p), false);
  });

  it("red -> green is due +14d and NOT retired (AC 24)", () => {
    const p = problem("two-sum", [attempt(DAY_1, "red"), attempt(DAY_2, "green")]);
    assert.equal(trailingRun(p.attempts), 1);
    assert.equal(reviewDueDate(p), "2026-09-30");
    assert.equal(isRetired(p), false);
  });

  it("clamps the ladder at its last rung", () => {
    const yellowRun4 = problem("two-sum", [
      attempt(DAY_1, "yellow"),
      attempt(DAY_2, "yellow"),
      attempt(DAY_5, "yellow"),
      attempt(DAY_12, "yellow"),
    ]);
    assert.equal(trailingRun(yellowRun4.attempts), 4);
    assert.equal(reviewDueDate(yellowRun4), "2026-10-17");

    const redRun5 = problem("two-sum", [
      attempt(DAY_1, "red"),
      attempt(DAY_2, "red"),
      attempt(DAY_5, "red"),
      attempt(DAY_12, "red"),
      attempt(DAY_15, "red"),
    ]);
    assert.equal(trailingRun(redRun5.attempts), 5);
    assert.equal(reviewDueDate(redRun5), "2026-10-20");
  });
});

// AC 30 — the degenerate seam. The merger drops empty-attempts records, but
// logAttempt and hand-built fixtures can still construct one transiently.
describe("degenerate input (AC 30)", () => {
  it("never throws on empty attempts", () => {
    const p = problem("two-sum", []);
    assert.equal(trailingRun([]), 0);
    assert.equal(trailingRun(p.attempts), 0);
    assert.equal(reviewDueDate(p), undefined);
    assert.equal(isRetired(p), false);
  });

  it("keeps a retired problem out of the queue while still reporting its due date", () => {
    const p = problem("two-sum", [attempt(DAY_1, "green"), attempt(DAY_15, "green")]);
    const days = [leetcodeDay(1, [{ slug: "two-sum", name: "Two Sum", pattern: "Hashing", role: "solve" }])];
    assert.equal(reviewDueDate(p), "2026-10-13");
    assert.deepEqual(getReviewQueue(leetcodeProgress([p]), days, "2026-10-20"), []);
  });

  it("keeps an empty-attempts problem out of the queue", () => {
    const days = [leetcodeDay(1, [{ slug: "two-sum", name: "Two Sum", pattern: "Hashing", role: "solve" }])];
    assert.deepEqual(getReviewQueue(leetcodeProgress([problem("two-sum", [])]), days, DAY_15), []);
  });
});

describe("isQueueOnlyDay", () => {
  it("matches a day with no problems, no cold review, and no prompt", () => {
    assert.equal(isQueueOnlyDay({ problems: [], coldReview: [] }), true);
  });

  it("does NOT match a day carrying a prompt", () => {
    assert.equal(
      isQueueOnlyDay({ problems: [], coldReview: [], prompt: "45-minute mock" }),
      false,
    );
  });

  it("does NOT match a day with problems but no cold review", () => {
    assert.equal(isQueueOnlyDay({ problems: [{}], coldReview: [] }), false);
  });

  it("does NOT match a day with cold review but no problems", () => {
    assert.equal(isQueueOnlyDay({ problems: [], coldReview: ["two-sum"] }), false);
  });
});

describe("getReviewQueue", () => {
  const days = [
    leetcodeDay(1, [
      { slug: "two-sum", name: "Two Sum", pattern: "Hashing", role: "solve" },
      { slug: "lru-cache", name: "LRU Cache", pattern: "Design", role: "study" },
    ]),
    leetcodeDay(2, [
      { slug: "valid-parentheses", name: "Valid Parentheses", pattern: "Stack", role: "solve" },
      { slug: "coin-change", name: "Coin Change", pattern: "DP", role: "solve" },
    ]),
  ];

  it("sorts most-overdue first, then due-today, then future", () => {
    const progress = leetcodeProgress([
      problem("two-sum", [attempt(DAY_1, "red")]), // due 09-16, 4 days overdue
      problem("lru-cache", [attempt(DAY_1, "yellow")]), // due 09-18, 2 days overdue
      problem("valid-parentheses", [attempt(DAY_5, "red")]), // due 09-20, today
      problem("coin-change", [attempt(DAY_5, "green")]), // due 10-03, future
    ]);
    const queue = getReviewQueue(progress, days, "2026-09-20");
    assert.deepEqual(
      queue.map((row) => [row.slug, row.overdueDays, row.dueOn]),
      [
        ["two-sum", 4, "2026-09-16"],
        ["lru-cache", 2, "2026-09-18"],
        ["valid-parentheses", 0, "2026-09-20"],
        ["coin-change", 0, "2026-10-03"],
      ],
    );
  });

  it("resolves name, pattern and role from the static content", () => {
    const progress = leetcodeProgress([problem("lru-cache", [attempt(DAY_1, "red")])]);
    const [row] = getReviewQueue(progress, days, DAY_2);
    assert.deepEqual(row, {
      slug: "lru-cache",
      name: "LRU Cache",
      pattern: "Design",
      role: "study",
      rating: "red",
      dueOn: "2026-09-16",
      overdueDays: 0,
    });
  });

  it("resolves week 7-8 user problems that appear in no content day", () => {
    const progress = leetcodeProgress(
      [problem("meeting-rooms-ii", [attempt(DAY_1, "yellow")])],
      [{ slug: "meeting-rooms-ii", name: "Meeting Rooms II", pattern: "Intervals", addedOn: DAY_1 }],
    );
    const [row] = getReviewQueue(progress, days, DAY_5);
    assert.equal(row.name, "Meeting Rooms II");
    assert.equal(row.pattern, "Intervals");
    assert.equal(row.role, "solve");
  });

  it("gives every row at least one recorded attempt (AC 13b)", () => {
    const progress = leetcodeProgress([
      problem("two-sum", [attempt(DAY_1, "red")]),
      problem("coin-change", []),
    ]);
    const queue = getReviewQueue(progress, days, DAY_5);
    assert.equal(queue.length, 1);
    for (const row of queue) {
      assert.ok(progress.problems[row.slug].attempts.length >= 1);
    }
  });
});

describe("patternConfidence", () => {
  const days = [
    leetcodeDay(1, [
      { slug: "two-sum", name: "Two Sum", pattern: "Hashing", role: "solve" },
      { slug: "group-anagrams", name: "Group Anagrams", pattern: "Hashing", role: "solve" },
    ]),
    leetcodeDay(2, [{ slug: "coin-change", name: "Coin Change", pattern: "DP", role: "solve" }]),
  ];

  it("tallies attempts per pattern", () => {
    const progress = leetcodeProgress([
      problem("two-sum", [attempt(DAY_1, "red"), attempt(DAY_2, "green")]),
      problem("group-anagrams", [attempt(DAY_2, "red")]),
      problem("coin-change", [attempt(DAY_5, "yellow")]),
    ]);
    assert.deepEqual(patternConfidence(progress, days), [
      { pattern: "Hashing", red: 2, yellow: 0, green: 1 },
      { pattern: "DP", red: 0, yellow: 1, green: 0 },
    ]);
  });

  it("omits patterns with no attempts", () => {
    const progress = leetcodeProgress([problem("coin-change", [attempt(DAY_5, "green")])]);
    assert.deepEqual(patternConfidence(progress, days), [
      { pattern: "DP", red: 0, yellow: 0, green: 1 },
    ]);
  });
});

describe("getTrackSummary", () => {
  const days = [1, 2, 3, 4].map((day) => leetcodeDay(day, []));

  it("computes completed / percent / current", () => {
    const summary = getTrackSummary(days, {
      currentDay: 2,
      days: { "lc-d01": { completedOn: DAY_1 } },
    });
    assert.equal(summary.total, 4);
    assert.equal(summary.completed, 1);
    assert.equal(summary.percent, 25);
    assert.equal(summary.currentDay, 2);
    assert.equal(summary.current.dayId, "lc-d02");
  });

  it("ignores completion records that name no day in the content", () => {
    const summary = getTrackSummary(days, {
      currentDay: 1,
      days: { "lc-d99": { completedOn: DAY_1 }, "lc-d01": { note: "no completion" } },
    });
    assert.equal(summary.completed, 0);
    assert.equal(summary.percent, 0);
  });

  it("rounds percent", () => {
    const summary = getTrackSummary(days, {
      currentDay: 4,
      days: { "lc-d01": { completedOn: DAY_1 }, "lc-d02": { completedOn: DAY_2 } },
    });
    assert.equal(summary.percent, 50);
    assert.equal(summary.current.day, 4);
  });
});

describe("markDayComplete", () => {
  it("records the completion date without mutating the input", () => {
    const before = leetcodeProgress([]);
    const snapshot = JSON.parse(JSON.stringify(before));
    const after = markDayComplete(before, "lc-d01", DAY_1);
    assert.equal(after.days["lc-d01"].completedOn, DAY_1);
    assert.deepEqual(before, snapshot);
  });

  it("is idempotent", () => {
    const once = markDayComplete(leetcodeProgress([]), "lc-d01", DAY_1);
    const twice = markDayComplete(once, "lc-d01", DAY_2);
    assert.equal(twice, once);
    assert.equal(twice.days["lc-d01"].completedOn, DAY_1);
    assert.equal(Object.keys(twice.days).length, 1);
  });

  it("preserves an existing day note", () => {
    const seeded = { ...leetcodeProgress([]), days: { "lc-d01": { note: "tough" } } };
    const after = markDayComplete(seeded, "lc-d01", DAY_1);
    assert.deepEqual(after.days["lc-d01"], { note: "tough", completedOn: DAY_1 });
  });
});

describe("setCurrentDay", () => {
  it("clamps at the low end", () => {
    assert.equal(setCurrentDay(leetcodeProgress([]), 0, 56).currentDay, 1);
    assert.equal(setCurrentDay(leetcodeProgress([]), -12, 56).currentDay, 1);
  });

  it("clamps at the high end", () => {
    assert.equal(setCurrentDay(leetcodeProgress([]), 999, 56).currentDay, 56);
    assert.equal(setCurrentDay(leetcodeProgress([]), 57, 56).currentDay, 56);
  });

  it("passes an in-range day through without mutating the input", () => {
    const before = leetcodeProgress([]);
    const after = setCurrentDay(before, 12, 56);
    assert.equal(after.currentDay, 12);
    assert.equal(before.currentDay, 1);
  });
});

describe("logAttempt", () => {
  it("appends without mutating the input", () => {
    const before = leetcodeProgress([problem("two-sum", [attempt(DAY_1, "red")])]);
    const snapshot = JSON.parse(JSON.stringify(before));
    const beforeProblems = before.problems;
    const beforeAttempts = before.problems["two-sum"].attempts;

    const after = logAttempt(before, "two-sum", DAY_2, "yellow");

    assert.deepEqual(before, snapshot);
    assert.equal(before.problems, beforeProblems);
    assert.equal(before.problems["two-sum"].attempts, beforeAttempts);
    assert.equal(before.problems["two-sum"].attempts.length, 1);
    assert.deepEqual(after.problems["two-sum"].attempts, [
      { date: DAY_1, rating: "red" },
      { date: DAY_2, rating: "yellow" },
    ]);
  });

  it("creates the problem record on a first attempt", () => {
    const after = logAttempt(leetcodeProgress([]), "coin-change", DAY_1, "green");
    assert.deepEqual(after.problems["coin-change"], {
      slug: "coin-change",
      attempts: [{ date: DAY_1, rating: "green" }],
    });
  });

  it("preserves a key insight", () => {
    const before = leetcodeProgress([
      { slug: "two-sum", attempts: [attempt(DAY_1, "red")], keyInsight: "complement map" },
    ]);
    const after = logAttempt(before, "two-sum", DAY_2, "green");
    assert.equal(after.problems["two-sum"].keyInsight, "complement map");
  });
});

describe("addUserProblem", () => {
  it("slugifies the name and appends without mutating the input", () => {
    const before = leetcodeProgress([]);
    const snapshot = JSON.parse(JSON.stringify(before));
    const after = addUserProblem(before, "Meeting Rooms II", "Intervals", DAY_1);
    assert.deepEqual(before, snapshot);
    assert.deepEqual(after.userProblems, [
      { slug: "meeting-rooms-ii", name: "Meeting Rooms II", pattern: "Intervals", addedOn: DAY_1 },
    ]);
  });

  it("dedupes by slug", () => {
    const once = addUserProblem(leetcodeProgress([]), "Meeting Rooms II", "Intervals", DAY_1);
    const twice = addUserProblem(once, "meeting rooms ii", "Sorting", DAY_2);
    assert.equal(twice, once);
    assert.equal(twice.userProblems.length, 1);
  });

  it("feeds the ladder once rated", () => {
    const days: LeetcodeDay[] = [];
    const added = addUserProblem(leetcodeProgress([]), "Meeting Rooms II", "Intervals", DAY_1);
    const rated = logAttempt(added, "meeting-rooms-ii", DAY_1, "red");
    const [row] = getReviewQueue(rated, days, DAY_2);
    assert.equal(row.slug, "meeting-rooms-ii");
    assert.equal(row.dueOn, "2026-09-16");
    assert.equal(row.overdueDays, 0);
  });
});

describe("slugify", () => {
  it("is deterministic", () => {
    assert.equal(slugify("Two Sum"), "two-sum");
    assert.equal(slugify("Two Sum"), "two-sum");
    assert.equal(slugify("0/1 Knapsack"), "0-1-knapsack");
    assert.equal(slugify("Find Median From Data Stream"), "find-median-from-data-stream");
  });

  it("is idempotent", () => {
    for (const name of [
      "Two Sum",
      "0/1 Knapsack",
      "  Trailing & leading  ",
      "Best Time to Buy/Sell Stock II",
      "already-a-slug",
    ]) {
      assert.equal(slugify(slugify(name)), slugify(name));
    }
  });
});
