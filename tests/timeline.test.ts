import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDailyEntry, DEFAULT_SETTINGS } from "../lib/defaults";
import {
  arrangeDailyEntry,
  generateDailyTimeline,
  getBlockDuration,
  getPendingCoreActivities,
  getTimelineStatusLabel,
  setActivityState,
  updateFocusContent,
} from "../lib/timeline";
import type { DailyEntry } from "../lib/types";

const TUESDAY = "2026-09-08";

function at(time: string): Date {
  return new Date(`${TUESDAY}T${time}:00`);
}

function tuesdayEntry(): DailyEntry {
  return createDailyEntry(TUESDAY, DEFAULT_SETTINGS);
}

function block(entry: DailyEntry, id: string) {
  return entry.timeline.find((item) => item.id === id);
}

describe("adaptive timeline", () => {
  it("creates new days in adaptive mode by default", () => {
    const entry = tuesdayEntry();

    assert.equal(entry.timelineMode, "adaptive");
    assert.equal(entry.energyMode, "normal");
    assert.equal(block(entry, "adaptive-status")?.kind, "anchor");
  });

  it("moves pending physical activity into the evening when work is complete", () => {
    const entry = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("17:45"),
    );

    assert.equal(block(entry, "decompression")?.start, "17:45");
    assert.equal(block(entry, "physical")?.start, "18:15");
    assert.equal(block(entry, "focus")?.kind, "focus");
    assert.equal(block(entry, "sleep")?.start, "23:00");
  });

  it("does not regenerate completed physical activity as a pending physical block", () => {
    const entry = arrangeDailyEntry(
      {
        ...tuesdayEntry(),
        physicalCompleted: true,
        physicalStatus: "completed",
        workCompleted: true,
        workStatus: "completed",
      },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("17:45"),
    );

    assert.equal(block(entry, "physical"), undefined);
    assert.equal(block(entry, "physical-completed")?.kind, "physical");
  });

  it("uses minimum viable blocks instead of pushing sleep when the evening is too short", () => {
    const entry = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("22:00"),
    );

    assert.ok(block(entry, "physical") ?? block(entry, "physical-minimum"));
    assert.equal(block(entry, "sleep")?.start, "23:00");
    assert.ok(entry.timeline.every((item) => item.end === undefined || item.end <= "23:00"));
  });

  it("prefers minimum versions earlier when low energy mode is active", () => {
    const entry = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "low",
      DEFAULT_SETTINGS,
      at("18:00"),
    );

    assert.equal(block(entry, "dinner")?.start, "18:20");
    assert.equal(getBlockDuration(block(entry, "physical")!), 20);
    assert.equal(getBlockDuration(block(entry, "focus")!), 25);
    assert.equal(getTimelineStatusLabel(entry.timeline), "Low Energy");
  });

  it("removes skipped focus from the remaining meaningful schedule", () => {
    const entry = arrangeDailyEntry(
      {
        ...tuesdayEntry(),
        workCompleted: true,
        workStatus: "completed",
        focusStatus: "skipped",
      },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("18:00"),
    );

    assert.equal(block(entry, "focus"), undefined);
    assert.deepEqual(getPendingCoreActivities(entry), ["Basketball"]);
  });

  it("preserves locked generated blocks during adaptive recalculation", () => {
    const original = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("17:45"),
    );
    const locked = {
      ...original,
      timeline: original.timeline.map((item) => (
        item.id === "physical" ? { ...item, start: "19:00", end: "19:30", locked: true } : item
      )),
    };
    const recalculated = arrangeDailyEntry(locked, "adaptive", "normal", DEFAULT_SETTINGS, at("18:30"));

    assert.equal(block(recalculated, "physical")?.start, "19:00");
    assert.equal(block(recalculated, "physical")?.end, "19:30");
    assert.equal(block(recalculated, "physical")?.locked, true);
  });

  it("keeps normal and late wake available as manual overrides", () => {
    const normal = generateDailyTimeline({
      dailyEntry: tuesdayEntry(),
      settings: DEFAULT_SETTINGS,
      timelineMode: "normal",
      energyMode: "normal",
    });
    const lateWake = generateDailyTimeline({
      dailyEntry: tuesdayEntry(),
      settings: DEFAULT_SETTINGS,
      timelineMode: "late-wake",
      energyMode: "normal",
    });

    assert.equal(normal.find((item) => item.id === "physical")?.start, "06:30");
    assert.equal(lateWake.find((item) => item.id === "physical")?.start, "18:00");
  });
});

describe("in-place activity edits (no clock-following)", () => {
  it("setActivityState marks only the matching block, leaving every other block untouched", () => {
    const before = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("17:45"),
    );
    const otherBlocksBefore = before.timeline.filter((item) => item.kind !== "physical");

    const after = setActivityState(before, "physical", "completed");
    const otherBlocksAfter = after.timeline.filter((item) => item.kind !== "physical");

    assert.equal(after.physicalStatus, "completed");
    assert.equal(after.physicalCompleted, true);
    assert.equal(block(after, "physical")?.state, "completed");
    assert.deepEqual(otherBlocksAfter, otherBlocksBefore);
  });

  it("setActivityState handles skip and revert-to-pending for every tracked activity", () => {
    const entry = tuesdayEntry();

    const skipped = setActivityState(entry, "focus", "skipped");
    assert.equal(skipped.focusStatus, "skipped");
    assert.equal(skipped.focusCompleted, false);
    assert.equal(block(skipped, "focus")?.state, "skipped");

    const decompressed = setActivityState(entry, "decompression", "completed");
    assert.equal(decompressed.decompressionStatus, "completed");

    const reverted = setActivityState(setActivityState(entry, "work", "completed"), "work", "pending");
    assert.equal(reverted.workStatus, "pending");
    assert.equal(reverted.workCompleted, false);
  });

  it("setActivityState never reads the clock and never regenerates the schedule", () => {
    const before = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("17:45"),
    );
    const statusBefore = block(before, "adaptive-status");

    const after = setActivityState(before, "physical", "completed");

    assert.deepEqual(block(after, "adaptive-status"), statusBefore);
  });

  it("updateFocusContent syncs the focus block's title/description without moving any block", () => {
    const before = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("17:45"),
    );
    const otherBlocksBefore = before.timeline.filter((item) => item.kind !== "focus");

    const after = updateFocusContent(before, { focusLabel: "Deep Work", focusObjective: "Ship the export flow." });
    const otherBlocksAfter = after.timeline.filter((item) => item.kind !== "focus");

    assert.equal(after.focusLabel, "Deep Work");
    assert.equal(after.focusObjective, "Ship the export flow.");
    assert.equal(block(after, "focus")?.title, "Deep Work");
    assert.equal(block(after, "focus")?.description, "Ship the export flow.");
    assert.equal(block(after, "focus")?.start, block(before, "focus")?.start);
    assert.deepEqual(otherBlocksAfter, otherBlocksBefore);
  });
});
