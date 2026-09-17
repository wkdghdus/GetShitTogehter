import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isQueueOnlyDay, slugify } from "../lib/curriculum";
import { LEETCODE_DAYS, LEETCODE_WEEKS } from "../lib/curricula/leetcode";
import { SYSTEM_DESIGN_DAYS, SYSTEM_DESIGN_WEEKS } from "../lib/curricula/system-design";

describe("system-design content integrity", () => {
  it("has exactly days 1..28 with no gaps or duplicates", () => {
    const days = SYSTEM_DESIGN_DAYS.map((d) => d.day).sort((a, b) => a - b);
    assert.deepEqual(
      days,
      Array.from({ length: 28 }, (_, i) => i + 1),
    );
  });

  it("has unique dayIds", () => {
    const dayIds = SYSTEM_DESIGN_DAYS.map((d) => d.dayId);
    assert.equal(new Set(dayIds).size, dayIds.length);
  });

  it("maps every day's week to a week range that contains it", () => {
    for (const day of SYSTEM_DESIGN_DAYS) {
      const week = SYSTEM_DESIGN_WEEKS.find((w) => w.week === day.week);
      assert.ok(week, `day ${day.day} references undefined week ${day.week}`);
      assert.ok(
        day.day >= week!.firstDay && day.day <= week!.lastDay,
        `day ${day.day} (week ${day.week}) falls outside range [${week!.firstDay}, ${week!.lastDay}]`,
      );
    }
  });

  it("tiles weeks 1-28 with no gaps or overlaps", () => {
    const sorted = [...SYSTEM_DESIGN_WEEKS].sort((a, b) => a.firstDay - b.firstDay);
    assert.equal(sorted[0].firstDay, 1);
    assert.equal(sorted[sorted.length - 1].lastDay, 28);
    for (let i = 0; i < sorted.length; i++) {
      assert.ok(sorted[i].firstDay <= sorted[i].lastDay);
      if (i > 0) {
        assert.equal(sorted[i].firstDay, sorted[i - 1].lastDay + 1);
      }
    }
  });

  it("sets mode to learn for days 1-14 and practice for days 15-28, with no exceptions", () => {
    for (const day of SYSTEM_DESIGN_DAYS) {
      const expected = day.day <= 14 ? "learn" : "practice";
      assert.equal(day.mode, expected, `day ${day.day} has mode ${day.mode}, expected ${expected}`);
    }
  });
});

describe("leetcode content integrity", () => {
  it("has exactly days 1..56 with no gaps or duplicates", () => {
    const days = LEETCODE_DAYS.map((d) => d.day).sort((a, b) => a - b);
    assert.deepEqual(
      days,
      Array.from({ length: 56 }, (_, i) => i + 1),
    );
  });

  it("has unique dayIds", () => {
    const dayIds = LEETCODE_DAYS.map((d) => d.dayId);
    assert.equal(new Set(dayIds).size, dayIds.length);
  });

  it("maps every day's week to a week range that contains it", () => {
    for (const day of LEETCODE_DAYS) {
      const week = LEETCODE_WEEKS.find((w) => w.week === day.week);
      assert.ok(week, `day ${day.day} references undefined week ${day.week}`);
      assert.ok(
        day.day >= week!.firstDay && day.day <= week!.lastDay,
        `day ${day.day} (week ${day.week}) falls outside range [${week!.firstDay}, ${week!.lastDay}]`,
      );
    }
  });

  it("tiles weeks 1-56 with no gaps or overlaps", () => {
    const sorted = [...LEETCODE_WEEKS].sort((a, b) => a.firstDay - b.firstDay);
    assert.equal(sorted[0].firstDay, 1);
    assert.equal(sorted[sorted.length - 1].lastDay, 56);
    for (let i = 0; i < sorted.length; i++) {
      assert.ok(sorted[i].firstDay <= sorted[i].lastDay);
      if (i > 0) {
        assert.equal(sorted[i].firstDay, sorted[i - 1].lastDay + 1);
      }
    }
  });

  it("has every problem slug unique across the whole 56-day content set", () => {
    const slugs = LEETCODE_DAYS.flatMap((d) => d.problems.map((p) => p.slug));
    assert.equal(new Set(slugs).size, slugs.length);
  });

  it("has slugify(name) equal to the stored slug for every problem", () => {
    for (const day of LEETCODE_DAYS) {
      for (const problem of day.problems) {
        assert.equal(
          problem.slug,
          slugify(problem.name),
          `day ${day.day} problem "${problem.name}" has slug "${problem.slug}", expected "${slugify(problem.name)}"`,
        );
      }
    }
  });

  it("resolves every coldReview slug to a problem defined on a strictly earlier day", () => {
    const slugToDay = new Map<string, number>();
    for (const day of LEETCODE_DAYS) {
      for (const problem of day.problems) {
        if (!slugToDay.has(problem.slug)) slugToDay.set(problem.slug, day.day);
      }
    }
    for (const day of LEETCODE_DAYS) {
      for (const slug of day.coldReview) {
        const definedOn = slugToDay.get(slug);
        assert.ok(definedOn !== undefined, `day ${day.day} coldReview slug "${slug}" is not defined on any day`);
        assert.ok(
          definedOn! < day.day,
          `day ${day.day} coldReview slug "${slug}" is defined on day ${definedOn}, which is not earlier`,
        );
      }
    }
  });

  it("has a non-empty coldReview set of exactly {6,14,21,28,35,42}", () => {
    const coldReviewDays = LEETCODE_DAYS.filter((d) => d.coldReview.length > 0).map((d) => d.day);
    assert.deepEqual(coldReviewDays, [6, 14, 21, 28, 35, 42]);
  });

  it("has a queue-only set (isQueueOnlyDay) of exactly {7,49}", () => {
    const queueOnlyDays = LEETCODE_DAYS.filter((d) => isQueueOnlyDay(d)).map((d) => d.day);
    assert.deepEqual(queueOnlyDays, [7, 49]);
  });

  it("has a prompt on every day in 43-48 and 50-56", () => {
    const promptDays = [43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 55, 56];
    for (const dayNumber of promptDays) {
      const day = LEETCODE_DAYS.find((d) => d.day === dayNumber);
      assert.ok(day, `day ${dayNumber} not found`);
      assert.notEqual(day!.prompt, undefined, `day ${dayNumber} is missing a prompt`);
    }
  });

  it("has no prompt on days 7 and 49", () => {
    for (const dayNumber of [7, 49]) {
      const day = LEETCODE_DAYS.find((d) => d.day === dayNumber);
      assert.ok(day, `day ${dayNumber} not found`);
      assert.equal(day!.prompt, undefined, `day ${dayNumber} unexpectedly has a prompt`);
    }
  });

  it("has exactly three role:study problems: LRU Cache, Find Median From Data Stream, 0/1 Knapsack", () => {
    const studyProblems = LEETCODE_DAYS.flatMap((d) => d.problems.filter((p) => p.role === "study"));
    const studySlugs = studyProblems.map((p) => p.slug).sort();
    assert.deepEqual(studySlugs, ["0-1-knapsack", "find-median-from-data-stream", "lru-cache"].sort());

    const knapsack = studyProblems.find((p) => p.slug === "0-1-knapsack");
    assert.ok(knapsack);
    assert.equal(knapsack!.url, undefined, "0/1 Knapsack is a pattern, not a real LeetCode problem, and must have no url");
  });

  it("has role:solve on every problem that is not one of the three study problems", () => {
    const studySlugs = new Set(["0-1-knapsack", "find-median-from-data-stream", "lru-cache"]);
    for (const day of LEETCODE_DAYS) {
      for (const problem of day.problems) {
        const expected = studySlugs.has(problem.slug) ? "study" : "solve";
        assert.equal(problem.role, expected, `problem "${problem.name}" (day ${day.day}) has role ${problem.role}, expected ${expected}`);
      }
    }
  });
});
