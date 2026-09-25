import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDailyEntry,
  createInitialAppState,
  createLeetcodeCurriculum,
  createSystemDesignCurriculum,
  DEFAULT_SETTINGS,
} from "../lib/defaults";
import { importAppState } from "../lib/storage";
import type { LeetcodeCurriculumProgress, SystemDesignCurriculumProgress } from "../lib/types";

const FIXED_NOW = new Date("2026-09-01T12:00:00");

const FLAT_ARRAY_FIELDS = [
  "applications",
  "projects",
  "workoutTemplates",
  "basketballSessions",
  "leetcodeEntries",
  "systemDesignEntries",
  "schoolProjects",
  "adminInbox",
  "workTasks",
  "mentalLoadInbox",
  "focusSessions",
] as const;

/** A version-1 blob with every pre-existing field and NO curriculum fields. */
function legacyState(): Record<string, unknown> {
  const state: Record<string, unknown> = { ...createInitialAppState(FIXED_NOW) };
  delete state.systemDesignCurriculum;
  delete state.leetcodeCurriculum;
  return state;
}

function blob(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({ ...legacyState(), ...overrides });
}

const VALID_SYSTEM_DESIGN: SystemDesignCurriculumProgress = {
  trackId: "system-design",
  contentVersion: 1,
  startedOn: "2026-09-01",
  currentDay: 5,
  days: {
    "sd-d01": { completedOn: "2026-09-01", note: "caching basics" },
    "sd-d02": { completedOn: "2026-09-02" },
  },
};

const VALID_LEETCODE: LeetcodeCurriculumProgress = {
  trackId: "leetcode",
  contentVersion: 1,
  startedOn: "2026-09-01",
  currentDay: 12,
  days: {
    "lc-d01": { completedOn: "2026-09-01" },
    "lc-d02": { completedOn: "2026-09-02", note: "sliding window clicked" },
  },
  problems: {
    "two-sum": {
      slug: "two-sum",
      attempts: [
        { date: "2026-09-01", rating: "red" },
        { date: "2026-09-02", rating: "yellow" },
      ],
      keyInsight: "complement in a hash map",
    },
    "lru-cache": {
      slug: "lru-cache",
      attempts: [{ date: "2026-09-03", rating: "green" }],
    },
  },
  userProblems: [
    { slug: "my-own-problem", name: "My Own Problem", pattern: "graph", addedOn: "2026-09-04" },
    { slug: "no-pattern", name: "No Pattern", addedOn: "2026-09-05" },
  ],
};

const FUZZ_VALUES: unknown[] = [
  undefined,
  null,
  0,
  1,
  -1,
  "",
  "x",
  true,
  [],
  [1, 2, 3],
  {},
  { currentDay: "3" },
  { currentDay: 0 },
  { currentDay: 999 },
  { currentDay: null },
  { currentDay: NaN },
  { days: "nope" },
  { days: [] },
  { days: { "sd-d01": "not a record" } },
  { problems: "nope" },
  { problems: { "two-sum": 5 } },
  { userProblems: {} },
  { userProblems: [null, 1, "x"] },
  {
    trackId: 42,
    contentVersion: "many",
    startedOn: 7,
    currentDay: {},
    days: [1, 2],
    problems: [[]],
    userProblems: "none",
  },
];

describe("storage migration — curriculum fields", () => {
  it("loads a legacy blob that has no curriculum fields at all", () => {
    const state = importAppState(blob());

    assert.deepEqual(state.systemDesignCurriculum, createSystemDesignCurriculum());
    assert.deepEqual(state.leetcodeCurriculum, createLeetcodeCurriculum());
  });

  it("preserves every pre-existing flat array element-for-element", () => {
    const original = legacyState();
    const state = importAppState(JSON.stringify(original)) as unknown as Record<string, unknown>;

    for (const field of FLAT_ARRAY_FIELDS) {
      assert.deepEqual(state[field], original[field], `${field} was not preserved`);
    }
  });

  it("round-trips valid curriculum progress unchanged", () => {
    const state = importAppState(blob({
      systemDesignCurriculum: VALID_SYSTEM_DESIGN,
      leetcodeCurriculum: VALID_LEETCODE,
    }));

    assert.deepEqual(state.systemDesignCurriculum, VALID_SYSTEM_DESIGN);
    assert.deepEqual(state.leetcodeCurriculum, VALID_LEETCODE);
  });

  it("never throws and always returns valid curricula for garbage input", () => {
    for (const value of FUZZ_VALUES) {
      const label = JSON.stringify(value) ?? "undefined";
      const state = importAppState(blob({
        systemDesignCurriculum: value,
        leetcodeCurriculum: value,
      }));

      const sd = state.systemDesignCurriculum;
      const lc = state.leetcodeCurriculum;

      assert.equal(sd.trackId, "system-design", label);
      assert.equal(lc.trackId, "leetcode", label);
      for (const [track, total] of [[sd, 28], [lc, 56]] as const) {
        assert.equal(typeof track.currentDay, "number", label);
        assert.ok(Number.isFinite(track.currentDay), label);
        assert.ok(track.currentDay >= 1 && track.currentDay <= total, `${label} → ${track.currentDay}`);
        assert.equal(typeof track.contentVersion, "number", label);
        assert.ok(Number.isFinite(track.contentVersion), label);
        assert.ok(track.days !== null && typeof track.days === "object" && !Array.isArray(track.days), label);
      }
      assert.ok(
        lc.problems !== null && typeof lc.problems === "object" && !Array.isArray(lc.problems),
        label,
      );
      assert.ok(Array.isArray(lc.userProblems), label);
    }
  });

  it("clamps or defaults currentDay instead of storing NaN", () => {
    const cases: Array<[unknown, number, number]> = [
      [0, 1, 1],
      [999, 28, 56],
      ["3", 3, 3],
      [null, 1, 1],
      [undefined, 1, 1],
      [12.6, 13, 13],
    ];

    for (const [value, expectedSystemDesign, expectedLeetcode] of cases) {
      const state = importAppState(blob({
        systemDesignCurriculum: { currentDay: value },
        leetcodeCurriculum: { currentDay: value },
      }));

      assert.equal(state.systemDesignCurriculum.currentDay, expectedSystemDesign, String(value));
      assert.equal(state.leetcodeCurriculum.currentDay, expectedLeetcode, String(value));
    }
  });

  it("restores trackId when it is wrong, absent, or swapped between the two fields", () => {
    const swapped = importAppState(blob({
      systemDesignCurriculum: { ...VALID_SYSTEM_DESIGN, trackId: "leetcode" },
      leetcodeCurriculum: { ...VALID_LEETCODE, trackId: "system-design" },
    }));
    assert.equal(swapped.systemDesignCurriculum.trackId, "system-design");
    assert.equal(swapped.leetcodeCurriculum.trackId, "leetcode");

    const absent = importAppState(blob({
      systemDesignCurriculum: { currentDay: 4 },
      leetcodeCurriculum: { currentDay: 4 },
    }));
    assert.equal(absent.systemDesignCurriculum.trackId, "system-design");
    assert.equal(absent.leetcodeCurriculum.trackId, "leetcode");
  });

  it("drops problem records that end up with no attempts", () => {
    const state = importAppState(blob({
      leetcodeCurriculum: {
        ...VALID_LEETCODE,
        problems: {
          "empty-attempts": { slug: "empty-attempts", attempts: [] },
          "attempts-not-an-array": { slug: "attempts-not-an-array", attempts: "nope" },
          "all-attempts-malformed": {
            slug: "all-attempts-malformed",
            attempts: [null, 3, "x", {}, { date: 5, rating: "red" }, { date: "2026-09-01", rating: "purple" }],
          },
          "survivor": {
            slug: "survivor",
            attempts: [{ date: "2026-09-01", rating: "red" }, { rating: "green" }],
          },
        },
      },
    }));

    assert.deepEqual(Object.keys(state.leetcodeCurriculum.problems), ["survivor"]);
    assert.deepEqual(state.leetcodeCurriculum.problems.survivor, {
      slug: "survivor",
      attempts: [{ date: "2026-09-01", rating: "red" }],
    });
  });

  it("drops malformed day and user-problem entries without dropping valid siblings", () => {
    const state = importAppState(blob({
      leetcodeCurriculum: {
        ...VALID_LEETCODE,
        days: {
          "lc-d01": { completedOn: "2026-09-01", note: "kept" },
          "lc-d02": "not a record",
          "lc-d03": { completedOn: 5, note: false },
        },
        userProblems: [
          { slug: "kept", name: "Kept", addedOn: "2026-09-04", pattern: "trie" },
          null,
          "x",
          { slug: "no-name", addedOn: "2026-09-04" },
          { name: "No Slug", addedOn: "2026-09-04" },
        ],
      },
    }));

    assert.deepEqual(state.leetcodeCurriculum.days, {
      "lc-d01": { completedOn: "2026-09-01", note: "kept" },
      "lc-d03": {},
    });
    assert.deepEqual(state.leetcodeCurriculum.userProblems, [
      { slug: "kept", name: "Kept", addedOn: "2026-09-04", pattern: "trie" },
    ]);
  });

  it("still rejects a blob missing a pre-existing required field", () => {
    const withoutApplications = legacyState();
    delete withoutApplications.applications;

    assert.throws(() => importAppState(JSON.stringify(withoutApplications)));
  });

  it("keeps version at 1", () => {
    assert.equal(importAppState(blob()).version, 1);
  });

  // Permanent regression guard: if someone "completes" isAppState() by adding a workTasks
  // check, this test fails instead of a user silently losing their saved data.
  it("loads a blob saved before the work board existed", () => {
    const legacy = legacyState();
    delete legacy.workTasks;
    const state = importAppState(JSON.stringify(legacy));
    assert.deepEqual(state.workTasks, []);
  });

  it("never returns a non-array workTasks for garbage input", () => {
    for (const value of FUZZ_VALUES) {
      const state = importAppState(blob({ workTasks: value }));
      assert.ok(Array.isArray(state.workTasks), JSON.stringify(value) ?? "undefined");
    }
  });

  it("round-trips valid work tasks and drops only malformed siblings", () => {
    const state = importAppState(blob({ workTasks: [
      { id: "w1", title: "Kept", category: "Platform", status: "in-progress", detail: "note" },
      { id: "w2", title: "No category", status: "blocked" },
      { id: "w3", title: "Bad status", category: "Platform", status: "nope" },
      null,
    ] }));
    assert.deepEqual(state.workTasks, [
      { id: "w1", title: "Kept", category: "Platform", status: "in-progress", detail: "note" },
    ]);
  });
});

describe("storage migration — adaptive planning does not follow the clock", () => {
  it("leaves an already-migrated daily entry's timeline completely untouched", () => {
    const dayEntry = createDailyEntry("2026-09-08", DEFAULT_SETTINGS);
    // A marker that generateAdaptiveSchedule could never produce itself — if the merge path
    // still regenerated the schedule, this would be replaced by a real status label
    // ("On Track" / "Adjusted" / "Compressed" / "Low Energy").
    dayEntry.timeline = dayEntry.timeline.map((item) =>
      item.id === "adaptive-status" ? { ...item, title: "UNTOUCHED-STATUS-MARKER" } : item,
    );
    const fixtureTimeline = dayEntry.timeline;

    const state = { ...legacyState(), dailyEntries: { "2026-09-08": dayEntry } };
    const firstLoad = importAppState(JSON.stringify(state));
    const secondLoad = importAppState(JSON.stringify(firstLoad));

    assert.deepEqual(firstLoad.dailyEntries["2026-09-08"].timeline, fixtureTimeline);
    assert.deepEqual(secondLoad.dailyEntries["2026-09-08"].timeline, fixtureTimeline);
  });

  it("still backfills a real generated schedule for a genuinely pre-migration legacy entry", () => {
    const legacyEntry: Record<string, unknown> = {
      date: "2026-09-08",
      weekday: "tuesday",
      physicalType: "basketball",
      physicalLabel: "Basketball",
      physicalStart: "06:30",
      physicalEnd: "07:30",
      physicalCompleted: false,
      workCompleted: false,
      focusCategory: "project",
      focusLabel: "GitHub / AI Project",
      focusObjective: "Ship one meaningful project improvement.",
      focusStart: "18:45",
      focusEnd: "20:15",
      focusCompleted: false,
      lifeCheckIns: [],
      timeline: [],
    };

    const state = { ...legacyState(), dailyEntries: { "2026-09-08": legacyEntry } };
    const loaded = importAppState(JSON.stringify(state));
    const entry = loaded.dailyEntries["2026-09-08"];

    assert.equal(entry.timelineMode, "adaptive");
    assert.ok(entry.timeline.some((item) => item.id === "adaptive-status"));
  });
});
