# Timeline Presets / Day Modes

Add a timeline switching system to the application.

The routine should not assume that every weekday starts perfectly.

Sometimes I may wake up too late to complete the scheduled morning physical activity. On those days, I still want to complete both physical activity and my career/study focus after work rather than considering the routine failed.

This should be implemented separately from Low Energy Mode.

---

# 1. Timeline Presets

The Today page should have a visible timeline selector near the top.

Example:

**Today's Timeline**

[ Normal Day ] [ Late Wake Day ]

The selected timeline determines how today's schedule is arranged.

Changing today's timeline should only affect the current day's `DailyEntry`.

It should not change the recurring weekly routine.

Default to:

**Normal Day**

Allow the default timeline to be changed in Settings.

---

# 2. Normal Day

This is the preferred routine.

The philosophy is:

> Morning = Body
> Workday = Responsibility
> Evening = Future
> Night = Life + Recovery

Default timeline:

| Time        | Activity                     |
| ----------- | ---------------------------- |
| 6:15 AM     | Wake up                      |
| 6:15–6:30   | Water, bathroom, preparation |
| 6:30–7:30   | Physical activity            |
| 7:30–7:50   | Shower                       |
| 7:50–8:15   | Breakfast + prepare          |
| 9:00–5:00   | Work                         |
| 5:30–6:00   | Protected decompression      |
| 6:00–6:45   | Dinner / family              |
| 6:45–8:15   | Main career / study focus    |
| 8:15–10:15  | Free Life                    |
| 10:15–10:45 | Prepare tomorrow             |
| 10:45–11:00 | Wind-down                    |
| 11:00 PM    | Sleep                        |

The physical activity is based on the weekly schedule.

Example:

Monday → Gym
Tuesday → Basketball
Wednesday → Recovery

---

# 3. Late Wake Day

Late Wake Day exists for mornings when I wake up too late to realistically complete the physical portion of the normal routine.

This is **not a failed day**.

Do not mark the missed morning exercise as incomplete.

Instead, move the scheduled physical activity into the post-work period.

The philosophy becomes:

> Morning = Get ready without rushing
> Workday = Responsibility
> After work = Decompress
> Early evening = Body
> Later evening = Future
> Night = Life + Recovery

Suggested default schedule:

| Time        | Activity                       |
| ----------- | ------------------------------ |
| 7:30 AM     | Wake up                        |
| 7:30–8:15   | Bathroom, breakfast, get ready |
| 9:00–5:00   | Work                           |
| 5:30–6:00   | **Protected decompression**    |
| 6:00–7:00   | Physical activity              |
| 7:00–7:45   | Shower + dinner                |
| 7:45–9:15   | Main career / study focus      |
| 9:15–10:30  | Free Life                      |
| 10:30–11:00 | Prepare tomorrow + wind-down   |
| 11:00–11:30 | Quiet personal time            |
| 11:30 PM    | Sleep                          |

These times should be editable in Settings.

---

# 4. Late Wake Physical Activity

Late Wake Day should preserve the physical activity originally scheduled for that day.

Examples:

If Tuesday normally says:

**Basketball**

then switching to Late Wake Day changes:

6:30–7:30 AM Basketball

into:

6:00–7:00 PM Basketball

Do not replace it with a generic workout.

Similarly:

Thursday Gym → Evening Gym

Wednesday Recovery → Evening Recovery

Sunday Rest remains Rest.

---

# 5. Protect Decompression

Even on Late Wake Day, do not schedule exercise immediately after arriving home.

The approximately 30-minute post-work decompression period should remain protected.

Example:

5:30 PM arrive home
5:30–6:00 decompression
6:00 physical activity

The user should not feel pressure to transition directly from a full workday into another demanding task.

---

# 6. Late Wake Study Block

The same primary career objective scheduled for the normal day should remain scheduled.

Example:

Tuesday:

Normal Day:

Morning → Basketball
Evening → GitHub / AI Project

Late Wake Day:

Evening → Basketball
Later evening → GitHub / AI Project

The career priority should not be replaced merely because physical activity moved to the evening.

---

# 7. Do Not Double Physical Activity

If the user completed some physical activity in the morning and later switches to Late Wake Day, do not automatically schedule another full workout.

Ask or infer from completion state.

If `physicalCompleted === true`, show:

**Physical activity already completed.**

Then the evening physical block can become:

* Free Life
* Dinner
* Additional optional activity

It should not create duplicate requirements.

---

# 8. Relationship With Low Energy Mode

Timeline selection and Low Energy Mode must be independent.

Conceptually there are two dimensions:

## Schedule

* Normal Day
* Late Wake Day

## Intensity

* Normal
* Low Energy

This allows four combinations.

### Normal Day + Normal Energy

Morning physical
Normal evening focus

### Late Wake Day + Normal Energy

Evening physical
Normal evening focus

### Normal Day + Low Energy

Short morning physical activity
25-minute career task

### Late Wake Day + Low Energy

Short physical activity after work
25-minute career task

Do not implement Low Energy Day as a competing third timeline preset.

It is an intensity modifier.

---

# 9. Late Wake + Low Energy Example

Example schedule:

| Time        | Activity                |
| ----------- | ----------------------- |
| 7:30 AM     | Wake                    |
| 9:00–5:00   | Work                    |
| 5:30–6:00   | Decompression           |
| 6:00–6:30   | Dinner                  |
| 6:30–6:50   | Light physical activity |
| 7:00–7:25   | Minimum career task     |
| 7:25 onward | Free Life / recovery    |
| ~11:00      | Wind-down               |

Physical options:

* 20-minute walk
* mobility
* light shooting
* short workout

Career options:

* one application
* one Leetcode problem
* one project task
* one system-design concept

This should count as successfully adapting the routine rather than failing to follow it.

---

# 10. Today Page UI

Near the top of Today, show something similar to:

### Today's Setup

**Timeline**
○ Normal Day
○ Late Wake Day

**Energy**
○ Normal
○ Low Energy

Do not hide these controls deep inside Settings.

Switching them should immediately regenerate the remaining schedule for the day.

Past completed blocks should not be erased.

---

# 11. Timeline Switching Behavior

When changing timeline:

1. Preserve completed activities.
2. Preserve today's focus objective.
3. Preserve notes.
4. Preserve the scheduled physical activity type.
5. Rearrange only activities that have not yet been completed.
6. Do not change historical days.
7. Do not modify the recurring weekly schedule.
8. Save today's selected mode to localStorage.

Example:

Today is Tuesday.

Default:

Basketball → 6:30 AM
GitHub → 6:45 PM

User selects Late Wake Day.

Result:

Basketball → 6:00 PM
GitHub → 7:45 PM

The activities themselves remain the same.

Only their placement changes.

---

# 12. Daily Data Model Update

Extend `DailyEntry`.

```ts
type TimelineMode = "normal" | "late-wake";

type EnergyMode = "normal" | "low";

interface DailyEntry {
  date: string;

  timelineMode: TimelineMode;
  energyMode: EnergyMode;

  physicalType: PhysicalType;
  physicalCompleted: boolean;

  workCompleted: boolean;

  focusCategory: FocusCategory;
  focusObjective: string;
  focusCompleted: boolean;
  focusNote?: string;

  shutdownDone?: string;
  tomorrowPriority?: string;
}
```

Replace the previous `lowEnergyMode: boolean` approach with `energyMode`.

This keeps schedule choice and energy level independent.

---

# 13. Schedule Data Model

Store timeline templates separately.

Example:

```ts
interface TimelineBlock {
  id: string;
  startTime: string;
  endTime?: string;
  type:
    | "wake"
    | "physical"
    | "work"
    | "decompression"
    | "meal"
    | "focus"
    | "free-life"
    | "shutdown"
    | "sleep";
  label: string;
}

interface TimelinePreset {
  id: TimelineMode;
  name: string;
  blocks: TimelineBlock[];
}
```

Provide two seeded presets:

* Normal Day
* Late Wake Day

Allow their times to be edited in Settings.

---

# 14. Timeline Generation

Create a centralized function such as:

```ts
generateDailyTimeline({
  date,
  timelineMode,
  energyMode,
  weeklyRoutine,
  settings,
  dailyEntry
})
```

This should produce the timeline displayed by Today.

Avoid putting schedule-generation logic directly inside React components.

The generated timeline should take into account:

* day of week
* physical activity type
* evening focus category
* selected timeline mode
* energy mode
* completion state

---

# 15. Visual Treatment

The Late Wake Day should not use warning colors.

Do not display messages such as:

* You overslept
* Routine failed
* Missed workout
* Behind schedule

Instead use neutral language.

Example:

## Late Wake Timeline

Morning training has been moved to this evening.

Your priorities for today remain the same.

---

# 16. Philosophy

The reason for this feature is resilience.

The routine should not depend on every morning going perfectly.

A rigid routine creates this failure pattern:

Wake up late → miss workout → routine feels broken → abandon the rest of the day.

The application should instead encourage:

Wake up late → switch timeline → continue the day.

The core principle is:

> Adapt the schedule without abandoning the day.

The Late Wake timeline therefore represents a legitimate version of the routine rather than an emergency fallback.

---

# 17. Success Calculation

The Daily Success system should work identically between timelines.

For a weekday, success still consists primarily of:

* Physical completed
* Work completed
* Future focus completed

It should not matter whether physical activity happened at:

6:30 AM

or:

6:00 PM.

If all three are completed:

## Day Complete

You've done enough today.

---

# 18. Settings Update

Add:

## Timeline Presets

### Normal Day

Editable:

* wake
* physical
* work
* decompression
* dinner
* focus
* free life
* shutdown
* sleep

### Late Wake Day

Editable:

* wake
* work
* decompression
* physical
* dinner
* focus
* free life
* shutdown
* sleep

Also allow:

**Default weekday timeline**

* Normal Day
* Late Wake Day

Default should initially be:

Normal Day

Do not automatically classify a day as Late Wake based purely on the current clock.

The user should remain able to manually choose it.

---

# 19. Updated Core Product Principle

Add another product principle:

### Principle 11

Adaptation is better than abandonment.

If the normal routine becomes unrealistic for a particular day, switch to an alternate timeline while preserving the day's important priorities.
