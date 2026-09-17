# Adaptive Timeline Engine

Add an adaptive scheduling mode that dynamically reorganizes the remaining day based on the current time and completion state.

The purpose is to avoid forcing the user into manually selecting a fixed timeline every time the day deviates from plan.

The system should answer:

> Given what time it is now, what have I already done, and what still matters today, what is the most reasonable remaining schedule?

The application should adapt the schedule while preserving the overall routine philosophy.

---

# 1. Timeline Modes

Support three timeline modes:

* Adaptive
* Normal
* Late Wake

Default:

**Adaptive**

Normal and Late Wake should remain available as manual overrides.

Adaptive mode should calculate the remaining schedule using the current local time.

---

# 2. Adaptive Mode Inputs

The adaptive scheduler should consider:

* current local time
* current day of week
* today's scheduled physical activity
* today's scheduled career / study focus
* physical completion state
* work completion state
* focus completion state
* whether decompression has happened
* energy mode
* bedtime
* minimum transition buffers
* completed timeline blocks
* optional user-entered events or locked blocks

Do not move activities that are already completed.

Do not remove important activities solely because their originally scheduled time has passed.

Instead, determine whether they should:

* move later
* shrink
* convert to minimum viable version
* remain optional
* be dropped for recovery

---

# 3. Main Adaptive Principle

Use this priority order for weekdays:

1. Work responsibilities
2. Sleep / bedtime protection
3. Physical activity
4. Main future-oriented focus
5. Decompression
6. Meals
7. Free life / relationships
8. Optional secondary work

The scheduler should never sacrifice sleep just to preserve every planned activity.

The scheduler should also preserve at least some intentional free time whenever realistically possible.

---

# 4. Adaptive Today Header

On the Today page show:

## Today's Plan

**Mode:** Adaptive

**Current status:** On track / Adjusted / Compressed / Low Energy

Example:

> It's 6:10 PM. Work is complete, basketball is still pending, and your GitHub focus block is still pending. Your evening has been reorganized below.

Use calm and neutral language.

Do not use warning language like:

* Behind
* Failed
* Missed everything
* Off track

---

# 5. Current Time Awareness

Adaptive mode should automatically compare the current local time against the planned timeline.

Example:

Normal plan:

6:30 AM Basketball
6:45 PM GitHub
11:00 PM Sleep

If it is currently 5:45 PM and basketball was not completed:

Adaptive mode should move basketball into the evening.

Example result:

5:45–6:15 PM Decompression
6:15–7:15 PM Basketball
7:15–8:00 PM Dinner + shower
8:00–9:20 PM GitHub focus
9:20–10:30 PM Free life
10:30–11:00 PM Wind-down

---

# 6. Preserve Completion State

Completed activities should never be regenerated.

Example:

If:

* Gym = completed
* Work = completed
* Focus = pending

Then Adaptive mode should not schedule physical activity again.

It should focus only on the remaining useful blocks.

---

# 7. Adaptive Compression

If there is less time remaining than the full routine requires, reduce block lengths intelligently.

Suggested default minimum durations:

| Block         |    Normal | Compressed Minimum |
| ------------- | --------: | -----------------: |
| Physical      |    60 min |             30 min |
| Focus         | 80–90 min |             45 min |
| Decompression |    30 min |             20 min |
| Dinner        |    45 min |             30 min |
| Free Life     |   120 min |             45 min |
| Wind-down     |    30 min |             20 min |

Do not reduce sleep below the configured bedtime target unless the user manually overrides it.

---

# 8. Minimum Viable Conversion

If there is not enough time for the compressed version, automatically suggest a minimum viable version.

Examples:

## Physical

Convert:

60-minute basketball session

to:

20-minute shooting / walk / mobility / short workout

## Focus

Convert:

80-minute career session

to:

25-minute minimum task

Examples:

* one Leetcode problem
* one application
* one project task
* review one system design concept

This should happen automatically when the remaining day is too short.

---

# 9. Adaptive Example: Early Day

Current time:

3:00 PM

Status:

* Morning gym completed
* Work still active
* Career focus pending

Output:

5:00–5:30 PM commute / transition
5:30–6:00 PM decompression
6:00–6:45 PM dinner
6:45–8:15 PM career focus
8:15–10:15 PM free life
10:15 PM shutdown
11:00 PM sleep

No major adjustment is needed.

Status:

**On Track**

---

# 10. Adaptive Example: Missed Morning Exercise

Current time:

5:40 PM

Status:

* Physical pending
* Work complete
* Focus pending

Output:

5:40–6:10 PM decompression
6:10–7:10 PM basketball
7:10–7:50 PM shower + dinner
7:50–9:10 PM focus block
9:10–10:20 PM free life
10:20–11:00 PM shutdown / wind-down

Status:

**Adjusted**

---

# 11. Adaptive Example: Late Evening

Current time:

8:30 PM

Status:

* Work complete
* Gym pending
* Career focus pending

Bedtime:

11:00 PM

Do not attempt:

8:30–9:30 gym
9:30–11:00 study
11:00+ shower / dinner / sleep

Instead compress.

Suggested:

8:30–8:50 PM dinner / reset
8:50–9:20 PM short workout
9:30–9:55 PM minimum focus task
9:55–10:30 PM free life
10:30–11:00 PM wind-down

Status:

**Compressed**

The day can still count as successful if the minimum versions are completed.

---

# 12. Adaptive Example: Very Late

Current time:

10:00 PM

Status:

* Work complete
* Physical pending
* Focus pending

Bedtime:

11:00 PM

Do not attempt to preserve the full routine.

Show:

## Tonight's Best Option

### Physical

10-minute mobility or short walk

### Future

Choose one 15–20 minute task

### Sleep

Protect 11:00 PM bedtime

Also show:

> Today does not need to be recovered in full. Complete a small version and continue tomorrow.

Do not schedule a full gym session or long study block.

---

# 13. Hard Sleep Boundary

Bedtime should act as a strong constraint.

Default:

11:00 PM

Allow a small configurable flexibility window, for example:

0–30 minutes

But the scheduler should never automatically push bedtime later than that.

Example setting:

**Maximum automatic bedtime delay:** 15 minutes

Default:

0 minutes

---

# 14. Decompression Rules

After the workday ends, preserve decompression before assigning demanding personal tasks.

Default:

30 minutes

Compressed minimum:

20 minutes

If the user explicitly marks decompression as complete, the scheduler may begin the next block earlier.

If the user finishes work much later than usual, use the compressed minimum.

---

# 15. Adaptive Physical Logic

Use the scheduled physical activity type for the day.

If it is pending:

### Enough time

Schedule the full session.

### Limited time

Schedule a compressed version.

### Very limited time

Suggest minimum viable physical activity.

### No realistic time before bedtime

Mark as:

**Optional recovery**

Do not force it into the day.

Example:

> A full basketball session would interfere with sleep. Replace it with 10–20 minutes of mobility or move on for today.

---

# 16. Adaptive Focus Logic

Use today's existing focus category and objective.

Do not change:

GitHub

into:

Leetcode

just because time is limited.

Instead reduce scope.

Example:

Full objective:

Implement authentication flow.

Compressed:

Implement login form validation.

Minimum:

Write the next-action plan and create the first implementation task.

The category remains the same.

---

# 17. Importance of the Next Action

Every focus category should support:

`nextAction`

Adaptive mode should prefer scheduling the smallest meaningful next action when time becomes constrained.

Examples:

Leetcode:
Review one sliding-window problem.

Applications:
Submit one saved application.

Project:
Fix one API error.

School:
Send one PM follow-up.

Admin:
Complete one form.

---

# 18. Recalculation

Recalculate the adaptive plan when:

* application opens
* user marks an activity complete
* user marks an activity skipped
* user changes energy mode
* user changes bedtime
* user changes focus objective
* user clicks Refresh Plan
* current time crosses into a major schedule boundary

Do not aggressively update every minute if unnecessary.

Recalculate on app load and meaningful user actions.

---

# 19. Refresh Plan Button

Include:

**Refresh Plan**

This lets the user manually ask:

> Rebuild the rest of today based on where I am now.

This should preserve:

* completed blocks
* notes
* selected focus
* physical type
* weekly routine

Only remaining schedule blocks should change.

---

# 20. Locking Activities

Allow a generated block to optionally be locked.

Example:

Basketball
6:30–7:30 PM
🔒 Locked

Locked activities must not be moved during future recalculations.

Useful for:

* booked basketball sessions
* meetings
* dinner plans
* calls
* appointments

Do not require locking by default.

---

# 21. Skipping Activities

Allow:

**Skip for Today**

If a user skips an activity, ask for no explanation.

The activity should no longer be repeatedly rescheduled.

Possible state:

```ts
type CompletionState =
  | "pending"
  | "completed"
  | "skipped";
```

Skipped is different from incomplete.

The goal is avoiding a task repeatedly following the user throughout the evening.

---

# 22. Pending Tasks Indicator

Show a small section:

## Still Meaningful Today

Example:

* Basketball
* GitHub focus

Do not show every unfinished task from the entire system.

Only show today's core pending commitments.

---

# 23. Adaptive Energy Mode

Energy mode should continue to work independently.

Modes:

* Normal
* Low Energy

Adaptive + Normal:

Try to preserve full or compressed activity.

Adaptive + Low Energy:

Prefer minimum viable versions much earlier.

Example:

At 6:00 PM with Low Energy enabled:

6:00–6:30 PM decompress
6:30–7:00 PM dinner
7:00–7:20 PM walk
7:30–7:55 PM one application
8:00 PM onward free life

Do not try to fill the evening simply because time exists.

---

# 24. User Override

Every generated block should remain editable.

The user should be able to:

* move it
* resize it
* skip it
* complete it
* lock it

Adaptive mode should help rather than control.

---

# 25. Suggested Adaptive Algorithm

Implement the scheduling logic outside React components.

Example:

```ts
interface AdaptiveScheduleInput {
  now: Date;
  dailyEntry: DailyEntry;
  settings: Settings;
  weeklyRoutine: WeeklyRoutine;
  lockedBlocks: TimelineBlock[];
}

interface AdaptiveScheduleResult {
  status: "on-track" | "adjusted" | "compressed" | "minimal";
  blocks: TimelineBlock[];
  message?: string;
}
```

Create:

```ts
generateAdaptiveSchedule(input: AdaptiveScheduleInput)
```

Suggested high-level algorithm:

```ts
1. Load today's planned physical and focus activities.

2. Remove completed or skipped activities from pending requirements.

3. Preserve all completed timeline blocks.

4. Insert locked future blocks.

5. Calculate available time between now and bedtime.

6. Reserve:
   - required work time
   - decompression
   - meals
   - wind-down
   - locked events

7. Calculate remaining usable time.

8. Schedule pending core activities by priority.

9. If insufficient time:
   - compress durations.

10. If still insufficient:
   - convert activities to minimum viable versions.

11. If still impossible:
   - protect sleep and mark lowest-priority activity optional.

12. Leave free-life time whenever reasonably possible.
```

---

# 26. Priority Scoring

Do not make the scheduler excessively complicated.

A simple deterministic priority system is preferred.

Example:

```ts
const priority = {
  sleep: 100,
  work: 100,
  locked: 100,
  meal: 90,
  decompression: 85,
  physical: 80,
  focus: 80,
  freeLife: 60,
  optional: 20
};
```

Physical and focus should have similar priority.

Neither should consistently destroy the other.

---

# 27. Today's Status

Calculate one adaptive status.

## On Track

No significant schedule change required.

## Adjusted

Activities were moved but remain full length.

## Compressed

Some activities were shortened.

## Minimal

Minimum viable versions are recommended.

These statuses should be informational only.

Do not score them as better or worse days.

---

# 28. Data Model Update

Use completion state rather than simple booleans where useful.

```ts
type CompletionState =
  | "pending"
  | "completed"
  | "skipped";

type TimelineMode =
  | "adaptive"
  | "normal"
  | "late-wake";

type EnergyMode =
  | "normal"
  | "low";

interface DailyEntry {
  date: string;

  timelineMode: TimelineMode;
  energyMode: EnergyMode;

  physicalType: PhysicalType;
  physicalState: CompletionState;

  workState: CompletionState;

  focusCategory: FocusCategory;
  focusObjective: string;
  focusState: CompletionState;
  focusNote?: string;

  decompressionState?: CompletionState;

  shutdownDone?: string;
  tomorrowPriority?: string;

  generatedStatus?: "on-track" | "adjusted" | "compressed" | "minimal";
}
```

---

# 29. Timeline Block Update

```ts
interface TimelineBlock {
  id: string;

  type:
    | "wake"
    | "physical"
    | "work"
    | "decompression"
    | "meal"
    | "focus"
    | "free-life"
    | "shutdown"
    | "sleep"
    | "custom";

  label: string;

  startTime: string;
  endTime?: string;

  state: CompletionState;

  locked?: boolean;

  generated?: boolean;

  compressed?: boolean;

  minimumViable?: boolean;
}
```

---

# 30. Do Not Continuously Rewrite History

Adaptive plans are only for the current day.

Historical days should store the final timeline that actually occurred.

Once a date passes:

* do not regenerate it
* preserve its completed blocks
* preserve notes
* preserve mode used
* preserve final status

---

# 31. Today Page Experience

The main screen should now prioritize:

## Right Now

Show the current recommended activity.

Example:

### Right Now

Decompression
5:35–6:05 PM

Next:

Basketball
6:05–7:05 PM

Then display:

## Rest of Today

A chronological adaptive timeline.

This makes the app useful throughout the day instead of merely showing the original morning plan.

---

# 32. Next Up

Show:

## Next Up

One upcoming block.

Example:

Basketball
Starts at 6:05 PM

Avoid displaying five upcoming tasks equally prominently.

The user should know what to do next without thinking about the entire evening.

---

# 33. Manual Completion

Every actionable block should allow:

* Complete
* Skip
* Edit
* Lock

When Complete or Skip is selected:

Immediately regenerate the remainder of the day.

Example:

User marks basketball complete at 6:48 instead of 7:05.

Adaptive mode may move dinner and focus slightly earlier.

---

# 34. Philosophy

The adaptive scheduler exists because real days are messy.

The application should not assume that productivity depends on following exact times perfectly.

The desired behavior is:

> Notice where I am now, preserve what matters, make the next reasonable decision, and continue.

The system should help prevent this pattern:

Miss one scheduled block → feel behind → abandon the routine.

Instead:

Miss one scheduled block → recalculate → continue with a reasonable day.

Add this product principle:

### Principle 12

Plan from the present, not from the schedule you already missed.
