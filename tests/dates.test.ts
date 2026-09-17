import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, diffDays } from "../lib/dates";

// The DST assertions below are only meaningful in a zone that observes DST.
// The npm `test` script pins TZ=America/Toronto; in UTC every span would be
// exactly 1.0 days and a Math.floor implementation would pass.
describe("date helpers", () => {
  it("runs in the pinned timezone", () => {
    assert.equal(process.env.TZ, "America/Toronto");
  });

  it("adds days across a calendar boundary", () => {
    assert.equal(addDays("2026-09-15", 1), "2026-09-16");
    assert.equal(addDays("2026-09-30", 1), "2026-10-01");
    assert.equal(addDays("2026-01-01", -1), "2025-12-31");
    assert.equal(addDays("2026-09-15", 0), "2026-09-15");
  });

  it("adds days across the spring-forward transition", () => {
    assert.equal(addDays("2026-03-08", 1), "2026-03-09");
    assert.equal(addDays("2026-03-01", 30), "2026-03-31");
  });

  it("counts whole days across spring forward", () => {
    // raw quotient 0.9583 — Math.floor gives 0
    assert.equal(diffDays("2026-03-08", "2026-03-09"), 1);
  });

  it("counts whole days across a span containing spring forward", () => {
    // raw quotient 29.9583 — Math.floor gives 29
    assert.equal(diffDays("2026-03-01", "2026-03-31"), 30);
  });

  it("counts whole days across fall back", () => {
    // raw quotient 1.0417
    assert.equal(diffDays("2026-11-01", "2026-11-02"), 1);
  });

  it("counts whole days with no transition in range", () => {
    assert.equal(diffDays("2026-09-15", "2026-09-16"), 1);
    assert.equal(diffDays("2026-09-15", "2026-09-15"), 0);
    assert.equal(diffDays("2026-09-16", "2026-09-15"), -1);
  });

  it("round-trips against addDays", () => {
    for (const start of ["2026-03-07", "2026-11-01", "2026-06-15"]) {
      for (const offset of [1, 3, 7, 14, 21]) {
        assert.equal(diffDays(start, addDays(start, offset)), offset);
      }
    }
  });
});
