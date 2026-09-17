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
  setBlockTime,
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

describe("manual block time editing", () => {
  it("setBlockTime updates only the target block's start/end and marks it generated:false, leaving every other block untouched", () => {
    const before = arrangeDailyEntry(tuesdayEntry(), "normal", "normal", DEFAULT_SETTINGS, at("08:00"));
    const otherBlocksBefore = before.timeline.filter((item) => item.id !== "dinner");

    const after = setBlockTime(before, "dinner", "19:15", "19:45");
    const otherBlocksAfter = after.timeline.filter((item) => item.id !== "dinner");

    assert.equal(block(after, "dinner")?.start, "19:15");
    assert.equal(block(after, "dinner")?.end, "19:45");
    assert.equal(block(after, "dinner")?.generated, false);
    assert.deepEqual(otherBlocksAfter, otherBlocksBefore);
  });

  it("setBlockTime allows an open-ended block (no end) and does not touch locked/state/title/description", () => {
    const entry = tuesdayEntry();
    const locked = {
      ...entry,
      timeline: entry.timeline.map((item) => (item.id === "sleep" ? { ...item, locked: true, state: "pending" as const } : item)),
    };

    const after = setBlockTime(locked, "sleep", "23:45");

    assert.equal(block(after, "sleep")?.start, "23:45");
    assert.equal(block(after, "sleep")?.end, undefined);
    assert.equal(block(after, "sleep")?.locked, true);
    assert.equal(block(after, "sleep")?.state, "pending");
    assert.equal(block(after, "sleep")?.title, block(locked, "sleep")?.title);
  });

  it("manualTimeline (Normal/Late Wake) prefers a persisted edit over the current Settings preset, while untouched blocks keep tracking the preset", () => {
    const original = arrangeDailyEntry(tuesdayEntry(), "normal", "normal", DEFAULT_SETTINGS, at("08:00"));
    const edited = setBlockTime(original, "dinner", "19:00", "19:20");

    const changedSettings = {
      ...DEFAULT_SETTINGS,
      timelinePresets: {
        ...DEFAULT_SETTINGS.timelinePresets,
        normal: {
          ...DEFAULT_SETTINGS.timelinePresets.normal,
          blocks: DEFAULT_SETTINGS.timelinePresets.normal.blocks.map((item) =>
            item.id === "free-life" ? { ...item, start: "20:30", end: "22:30" } : item,
          ),
        },
      },
    };

    const regenerated = generateDailyTimeline({
      dailyEntry: edited,
      settings: changedSettings,
      timelineMode: "normal",
      energyMode: "normal",
    });

    const dinnerBlock = regenerated.find((item) => item.id === "dinner");
    const freeLifeBlock = regenerated.find((item) => item.id === "free-life");

    assert.equal(dinnerBlock?.start, "19:00");
    assert.equal(dinnerBlock?.end, "19:20");
    assert.equal(dinnerBlock?.generated, false);
    assert.equal(freeLifeBlock?.start, "20:30");
    assert.equal(freeLifeBlock?.end, "22:30");
  });

  it("Adaptive mode: an edited non-physical/non-focus block (e.g. dinner) survives a later Adapt Plan click", () => {
    const before = arrangeDailyEntry(tuesdayEntry(), "adaptive", "normal", DEFAULT_SETTINGS, at("09:00"));
    const edited = setBlockTime(before, "dinner", "17:00", "17:30");

    const after = arrangeDailyEntry(edited, "adaptive", "normal", DEFAULT_SETTINGS, at("09:30"));

    assert.equal(block(after, "dinner")?.start, "17:00");
    assert.equal(block(after, "dinner")?.end, "17:30");
    assert.equal(block(after, "dinner")?.generated, false);
  });

  it("Adaptive mode: an edited physical block is allowed to move again on a later Adapt Plan click (accepted trade-off, not a bug)", () => {
    const before = arrangeDailyEntry(tuesdayEntry(), "adaptive", "normal", DEFAULT_SETTINGS, at("09:00"));
    const edited = setBlockTime(before, "physical", "03:00", "03:15");

    const after = arrangeDailyEntry(edited, "adaptive", "normal", DEFAULT_SETTINGS, at("09:30"));

    assert.notEqual(block(after, "physical"), undefined);
    assert.notEqual(block(after, "physical")?.start, "03:00");
  });

  it("Adaptive mode: editing a block then clicking Adapt Plan never produces two blocks with the same id (regression: preserved edit + freshly generated block sharing an id)", () => {
    const before = arrangeDailyEntry(tuesdayEntry(), "adaptive", "normal", DEFAULT_SETTINGS, at("09:00"));
    const edited = setBlockTime(before, "dinner", "17:00", "17:30");

    const after = arrangeDailyEntry(edited, "adaptive", "normal", DEFAULT_SETTINGS, at("09:30"));

    const idCounts = after.timeline.reduce<Record<string, number>>((counts, item) => {
      counts[item.id] = (counts[item.id] ?? 0) + 1;
      return counts;
    }, {});
    const duplicates = Object.entries(idCounts).filter(([, count]) => count > 1);

    assert.deepEqual(duplicates, []);
  });

  it("editing the physical block syncs entry.physicalStart/physicalEnd (read by the Body card and doneMarker), and editing focus syncs entry.focusStart/focusEnd", () => {
    const before = arrangeDailyEntry(tuesdayEntry(), "adaptive", "normal", DEFAULT_SETTINGS, at("09:00"));

    const physicalEdited = setBlockTime(before, "physical", "14:00", "15:30");
    assert.equal(physicalEdited.physicalStart, "14:00");
    assert.equal(physicalEdited.physicalEnd, "15:30");
    assert.equal(block(physicalEdited, "physical")?.start, "14:00");

    const focusEdited = setBlockTime(before, "focus", "16:00", "17:00");
    assert.equal(focusEdited.focusStart, "16:00");
    assert.equal(focusEdited.focusEnd, "17:00");
    assert.equal(block(focusEdited, "focus")?.start, "16:00");
  });

  it("locking and editing a block's time remain fully independent actions", () => {
    const entry = arrangeDailyEntry(tuesdayEntry(), "normal", "normal", DEFAULT_SETTINGS, at("08:00"));

    const editedOnly = setBlockTime(entry, "dinner", "19:15", "19:45");
    assert.equal(block(editedOnly, "dinner")?.locked, undefined);

    const lockedEdited = {
      ...editedOnly,
      timeline: editedOnly.timeline.map((item) => (item.id === "dinner" ? { ...item, locked: true } : item)),
    };
    const editedAgain = setBlockTime(lockedEdited, "dinner", "19:30", "20:00");
    assert.equal(block(editedAgain, "dinner")?.locked, true);
  });
});

describe("adapting after decompression is checked off early", () => {
  it("ends decompression now and starts the next task immediately, instead of waiting for its full window", () => {
    const scheduled = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("17:45"),
    );
    assert.equal(block(scheduled, "decompression")?.start, "17:45");
    assert.equal(block(scheduled, "decompression")?.end, "18:15");

    const checkedOff = setActivityState(scheduled, "decompression", "completed");
    const adapted = arrangeDailyEntry(checkedOff, "adaptive", "normal", DEFAULT_SETTINGS, at("18:00"));

    assert.equal(block(adapted, "decompression")?.end, "18:00");
    assert.equal(block(adapted, "physical")?.start, "18:00");
  });

  it("leaves a decompression block untouched once its scheduled window has already elapsed", () => {
    const scheduled = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("17:45"),
    );
    const checkedOff = setActivityState(scheduled, "decompression", "completed");
    const adapted = arrangeDailyEntry(checkedOff, "adaptive", "normal", DEFAULT_SETTINGS, at("18:20"));

    assert.equal(block(adapted, "decompression")?.end, "18:15");
    assert.equal(block(adapted, "physical")?.start, "18:20");
  });

  it("does not truncate a locked decompression block", () => {
    const scheduled = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("17:45"),
    );
    const checkedOff = setActivityState(scheduled, "decompression", "completed");
    const locked = {
      ...checkedOff,
      timeline: checkedOff.timeline.map((item) => (item.kind === "decompression" ? { ...item, locked: true } : item)),
    };
    const adapted = arrangeDailyEntry(locked, "adaptive", "normal", DEFAULT_SETTINGS, at("18:00"));

    assert.equal(block(adapted, "decompression")?.end, "18:15");
    assert.equal(block(adapted, "physical")?.start, "18:15");
  });

  it("drops a decompression block marked done before it was ever scheduled to start, instead of inverting its range", () => {
    const scheduled = arrangeDailyEntry(tuesdayEntry(), "adaptive", "normal", DEFAULT_SETTINGS, at("15:00"));
    assert.equal(block(scheduled, "decompression")?.start, "17:30");

    const checkedOff = setActivityState(scheduled, "decompression", "completed");
    const adapted = arrangeDailyEntry(checkedOff, "adaptive", "normal", DEFAULT_SETTINGS, at("15:10"));

    assert.equal(block(adapted, "decompression"), undefined);
    assert.ok(adapted.timeline.every((item) => item.end === undefined || item.end >= item.start));
  });

  it("never produces a block whose end precedes its start, across a range of adapt times", () => {
    const scheduled = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("17:45"),
    );
    const checkedOff = setActivityState(scheduled, "decompression", "completed");

    for (const time of ["17:00", "17:45", "18:00", "18:14", "18:15", "18:16", "19:00"]) {
      const adapted = arrangeDailyEntry(checkedOff, "adaptive", "normal", DEFAULT_SETTINGS, at(time));
      assert.ok(
        adapted.timeline.every((item) => item.end === undefined || item.end >= item.start),
        `inverted block at adapt time ${time}: ${JSON.stringify(adapted.timeline.find((item) => item.end !== undefined && item.end < item.start))}`,
      );
    }
  });

  it("is idempotent: pressing Adapt Plan again at the same time does not shift the trimmed decompression block further", () => {
    const scheduled = arrangeDailyEntry(
      { ...tuesdayEntry(), workCompleted: true, workStatus: "completed" },
      "adaptive",
      "normal",
      DEFAULT_SETTINGS,
      at("17:45"),
    );
    const checkedOff = setActivityState(scheduled, "decompression", "completed");

    const firstAdapt = arrangeDailyEntry(checkedOff, "adaptive", "normal", DEFAULT_SETTINGS, at("18:00"));
    const secondAdapt = arrangeDailyEntry(firstAdapt, "adaptive", "normal", DEFAULT_SETTINGS, at("18:00"));

    assert.equal(block(secondAdapt, "decompression")?.end, "18:00");
    assert.equal(block(secondAdapt, "physical")?.start, "18:00");
  });
});
