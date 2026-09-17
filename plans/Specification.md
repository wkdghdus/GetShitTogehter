# Build Specification: Personal Routine Dashboard

Build a simple personal web application that helps me follow a sustainable daily routine around my 9–5 job, career development, physical activity, relationships, rest, school responsibilities, and administrative work.

This is a personal tool. It does not need authentication, collaboration, payments, cloud infrastructure, or complicated integrations.

The core philosophy of the application is:

> One physical win + my 9–5 responsibilities + one future-oriented win = a successful weekday.

The application should prevent me from turning every day into an endless productivity checklist.

The goal is consistency, focus, mental clarity, and sustainable progress without burnout.

---

# 1. Technical Requirements

Use a simple modern web stack.

Preferred:

* Next.js
* TypeScript
* React
* Tailwind CSS
* localStorage for persistence

Do not add:

* authentication
* backend database
* external APIs
* analytics
* AI APIs
* complicated state-management libraries
* unnecessary dependencies

The application should run locally with:

```bash
npm install
npm run dev
```

Persist all user-entered data in localStorage.

The application should work well on desktop first but also remain usable on mobile.

Keep the UI minimal, clean, calm, and functional.

Do not over-design it.

---

# 2. Main Application Philosophy

The application should actively discourage the idea that I need to complete everything every day.

There are three main weekday wins:

## Body

Complete the scheduled morning physical activity.

## Responsibility

Complete the normal 9–5 workday.

The application does not need to track work tasks in detail.

## Future

Complete one meaningful career, school, or administrative focus block after work.

Once these three areas are satisfied, the day should visibly appear successful.

The interface should communicate:

> You have done enough today.

The application should never encourage filling every empty hour with more work.

Rest and relationships are legitimate parts of the routine, not rewards for exhausting myself.

---

# 3. Main Navigation

Create the following top-level sections:

1. Today
2. Career
3. Physical
4. Applications
5. Projects
6. School
7. Admin
8. Life & Recovery
9. Focus
10. Weekly Review
11. Settings

A simple sidebar on desktop and compact navigation on mobile is sufficient.

---

# 4. Today Dashboard

This is the default page and the most important screen.

The user should be able to understand the entire day within several seconds.

Display the current date prominently.

Example:

Monday, September 7

Below it, show three major daily cards.

---

## 4.1 Body Card

Show today's scheduled physical activity.

Possible values:

* Gym
* Basketball
* Recovery
* Rest

Example:

### Body

Basketball
6:30 AM – 7:30 AM

Checkbox:

* Completed

If completed, visually mark the section as done.

---

## 4.2 Responsibility Card

Show:

### Work

9:00 AM – 5:00 PM

Checkbox:

* Workday complete

This is deliberately simple.

The application should not become a work task manager.

---

## 4.3 Future Card

Show exactly one primary evening objective.

Example:

### Future

Leetcode
6:45 PM – 8:15 PM

Allow:

* Start Focus Session
* Mark Complete
* Add short note

The application should strongly emphasize that this is the main productive objective for the evening.

Do not display a giant secondary task list beside it.

---

# 5. Daily Timeline

Below the three cards, display today's routine chronologically.

Default weekday schedule:

| Time        | Activity                           |
| ----------- | ---------------------------------- |
| 6:15 AM     | Wake up                            |
| 6:15–6:30   | Water, bathroom, light preparation |
| 6:30–7:30   | Physical activity                  |
| 7:30–7:50   | Shower                             |
| 7:50–8:15   | Breakfast + prepare                |
| 9:00–5:00   | Work                               |
| 5:30–6:00   | Decompression                      |
| 6:00–6:45   | Dinner / family                    |
| 6:45–8:15   | Main focus block                   |
| 8:15–10:15  | Free life                          |
| 10:15–10:45 | Prepare tomorrow                   |
| 10:45–11:00 | Quiet wind-down                    |
| 11:00 PM    | Sleep                              |

The timeline should be editable from Settings.

Do not turn each timeline item into a task requiring completion.

Some blocks are simply boundaries and reminders.

---

# 6. Morning Physical Routine

Physical activity happens primarily in the morning because I do not want exercise competing with career work and recovery during the evening.

Default weekly schedule:

### Monday

Gym

### Tuesday

Basketball

### Wednesday

Recovery

### Thursday

Gym

### Friday

Basketball

### Saturday

Flexible basketball, pickup, or gym

### Sunday

Rest

---

# 7. Physical Section

Create a dedicated Physical page.

The goal of this page is consistency, not obsessive fitness tracking.

Separate it into four subsections.

---

## 7.1 Gym

Explain:

Gym sessions support general strength, athleticism, basketball performance, injury prevention, and physical health.

The purpose is not to maximize bodybuilding volume.

Default target:

2 gym sessions per week.

Allow the user to create simple workout templates.

Example fields:

* Exercise
* Sets
* Reps
* Optional weight
* Optional notes

Example:

Bench Press
3 × 8

Lat Pulldown
3 × 10

Squat or Leg Press
3 × 8

Shoulder Press
3 × 8

Core
3 sets

Keep workout logging optional.

Completing the session matters more than entering perfect data.

---

## 7.2 Basketball

Explain:

Basketball is both athletic training and an activity I genuinely enjoy.

It contributes to:

* fitness
* skill development
* mental reset
* enjoyment
* getting outside
* long-term athletic goals

Default target:

2–3 basketball sessions per week.

Allow basketball sessions to have a type:

* Shooting
* Ball handling
* Finishing
* Footwork
* Pickup
* Mixed practice

Allow a short optional note after each session.

Example:

Worked on left-hand finishes and pull-up jumpers.

Avoid advanced basketball statistics.

---

## 7.3 Recovery

Explain:

Recovery days prevent the routine from becoming physically exhausting.

Recovery can include:

* walking
* stretching
* mobility
* light shooting
* easy outdoor activity
* extra sleep

Recovery should count as successfully following the routine.

It should not visually look like a failed workout day.

---

## 7.4 Rest

Explain:

Rest is intentional.

Sunday should normally contain no required workout.

The application should explicitly reinforce that recovery supports consistency and performance.

---

# 8. Career Section

Career is the highest long-term development priority.

However, career development should happen through focused, bounded sessions rather than endless evening work.

Divide Career into:

1. Interview Prep
2. GitHub / AI Projects
3. Internship Applications

Show weekly progress for each.

Do not create daily quotas for everything.

---

# 9. Interview Prep Section

Interview preparation has two major areas.

---

## 9.1 Leetcode

Purpose:

Develop reliable problem-solving ability for technical interviews.

The focus should be pattern recognition and explaining solutions clearly, not maximizing the number of solved problems.

Track:

* Problem name
* Difficulty
* Pattern
* Status
* Date practiced
* Confidence
* Notes

Patterns could include:

* Arrays
* Hash maps
* Two pointers
* Sliding window
* Binary search
* Stack
* Linked list
* Trees
* Graphs
* Heap
* Backtracking
* Dynamic programming
* Greedy
* Intervals

Confidence:

* Weak
* Developing
* Comfortable
* Strong

Allow problems to be marked:

* New
* Solved
* Review

The system should make review problems easy to find.

Do not gamify raw problem count too heavily.

---

## 9.2 System Design

Purpose:

Develop the ability to reason about larger software systems and communicate architectural tradeoffs.

Track study topics such as:

* Load balancing
* Caching
* Databases
* Replication
* Partitioning
* Message queues
* APIs
* Rate limiting
* Consistency
* Distributed systems
* Search
* Object storage
* CDN
* Observability

Allow entries with:

* Topic
* Status
* Notes
* Last studied
* Confidence

Also support practice cases.

Examples:

* Design URL shortener
* Design Twitter feed
* Design notification service
* Design file storage
* Design chat application

The emphasis should be understanding and explanation rather than memorizing diagrams.

---

# 10. GitHub / AI Projects Section

This section exists to help me consistently ship real technical work.

The goal is:

> One meaningful shipped improvement per week.

Do not measure success by hours worked.

A project should contain:

* Project name
* Description
* Current milestone
* Next meaningful action
* Repository URL, optional
* Status

Statuses:

* Active
* Paused
* Complete

Each project can contain tasks.

However, emphasize one field above everything else:

## Next Meaningful Action

Example:

Implement persistent memory storage.

or:

Add evaluation script for retrieval quality.

This should be visible on the Today page whenever project work is selected as the evening focus.

---

# 11. Internship Applications Section

Applications are extremely important because interview preparation has limited value if I am not entering recruiting pipelines.

The application should encourage consistent applications without turning the process into mass spam.

Target:

10–15 quality applications per week.

Allow each internship application to track:

* Company
* Role
* Location
* Job URL
* Date applied
* Status
* Referral
* Notes
* Next action

Statuses:

* Saved
* Applied
* OA
* Recruiter Screen
* Technical Interview
* Final Interview
* Offer
* Rejected
* Withdrawn

Show weekly count:

Applied this week: X / 10

Do not create guilt-inducing red warning states if the target is missed.

Use neutral progress indicators.

---

# 12. School Section

This section exists primarily for project management responsibilities.

The current main school responsibility is acting as PM for a project.

Allow projects with:

* Project name
* Goal
* Current phase
* Team members
* Upcoming milestone
* Deadline
* Notes

Tasks should include:

* Task
* Owner
* Due date
* Status

Statuses:

* Not Started
* In Progress
* Blocked
* Complete

Also include a small section:

## PM Attention

Allow me to enter the one or two things currently requiring my attention as PM.

Example:

Finalize October experiment scope.

or:

Confirm dataset preprocessing ownership.

School should normally be handled during Sunday planning or a designated evening rather than occupying every weekday.

---

# 13. Admin Section

Admin work includes miscellaneous life responsibilities that do not belong inside career or school.

Examples:

* email
* appointment
* paperwork
* booking
* finances
* errands
* forms
* household tasks

Admin tasks should have:

* Task
* Optional due date
* Status
* Notes

Include an Inbox for quickly dumping administrative items.

Friday should normally be the default Admin / Catch-up evening.

Admin tasks should not automatically appear on the main Today screen unless they are selected as today's primary focus.

---

# 14. Life & Recovery Section

This section is extremely important.

The application must treat personal life as part of the routine rather than wasted time.

Create sections for:

* Family
* Girlfriend
* Friends
* Outside / Coffee
* Free Time
* Rest

Explain prominently:

These activities prevent burnout and help make the routine sustainable.

They should not require detailed tracking.

Instead allow optional simple check-ins.

Example:

Today I:

* Spent time with family
* Called girlfriend
* Went outside
* Had intentional free time

This should never become another checklist that creates pressure.

The purpose is awareness.

---

# 15. Decompression Period

The period from approximately 5:30 PM to 6:00 PM should be explicitly protected.

Display on the Today page:

## Decompression

Work is finished.

Do not immediately begin career tasks.

Suggested activities:

* lie down
* listen to music
* walk
* snack
* shower
* sit outside
* talk to family

Avoid turning this period into another productivity block.

The application should communicate that mental transition from work to personal life is necessary.

---

# 16. Free Life Block

Default:

8:15 PM – 10:15 PM

This period should be visibly labelled:

## Free Life

Examples:

* call girlfriend
* family
* friends
* coffee
* walk
* gaming
* YouTube
* movie
* basketball highlights
* reading
* nothing

Do not describe this as a reward that must be earned through extreme productivity.

The day's planned focus block being completed is enough.

---

# 17. Focus Section

The purpose of this section is to make working time dense rather than long.

The application should include a simple focus timer.

Default focus session:

45 minutes focus
10 minute break
35 minutes focus

Total focused work:

80 minutes

Controls:

* Start
* Pause
* Reset
* Skip break
* End session

During a focus session, prominently display:

## Current objective

Example:

Complete two-pointer Leetcode review.

Allow the user to write the objective before starting.

At the end ask:

What did you complete?

Provide one short text field.

Do not add complicated Pomodoro statistics.

---

# 18. Screen Time / Attention Section

Include this inside Focus.

The purpose is reducing fragmented attention and doom scrolling.

Display the following principles.

---

## Morning Rule

No algorithmic feeds before work.

Examples:

* TikTok
* Instagram Reels
* YouTube Shorts
* Reddit feeds
* X timeline

The goal is avoiding filling the brain with unrelated information before the day begins.

---

## Focus Rule

Phone should not be within casual reach during a focus session.

Suggested:

Put phone across the room.

---

## Break Rule

Do not use short-form feeds during focus breaks.

A ten-minute scrolling break frequently destroys the next focus block.

Better breaks:

* stand
* water
* bathroom
* stretch
* window
* short walk

---

## Intentional Consumption

Screen use is not inherently bad.

The goal is deciding when screens receive attention.

The evening free-life block can include intentional:

* YouTube
* Reddit
* Instagram
* games
* entertainment

without guilt.

---

## Bed Rule

Avoid bringing the phone into bed.

The goal is protecting sleep rather than trying to become someone who never uses their phone.

---

# 19. Mental Load / Unfinished Work

Create a small section called:

## Mental Load

This section should help externalize unfinished responsibilities.

Provide one universal Inbox where I can quickly enter anything occupying my mind.

Examples:

* apply to Shopify
* send professor message
* fix project bug
* book dentist
* review graph problems

Then allow each item to later be assigned to:

* Career
* Applications
* Project
* School
* Admin
* Personal

The philosophy:

Unfinished work creates anxiety when I am afraid I will forget it.

Capturing it means I do not need to mentally rehearse it.

The application should show:

> Captured does not mean it must be completed today.

---

# 20. Weekly Priorities

Every week should have exactly three major outcomes.

Create a Weekly Review page.

At the top:

## This Week's Three Outcomes

Allow exactly three entries.

Example:

1. Submit 12 internship applications.
2. Ship authentication feature.
3. Complete project PM milestone.

These should remain visible throughout the week.

Everything else is secondary.

Do not allow more than three primary weekly outcomes.

The goal is preventing dozens of simultaneous priorities.

---

# 21. Weekly Schedule

Default evening theme:

| Day       | Evening Focus               |
| --------- | --------------------------- |
| Monday    | Leetcode                    |
| Tuesday   | GitHub / AI Project         |
| Wednesday | System Design               |
| Thursday  | Internship Applications     |
| Friday    | Admin / Catch-up            |
| Saturday  | Project + Applications      |
| Sunday    | School PM + Weekly Planning |

Make this editable.

The Today page should automatically select the appropriate default focus based on the day.

Allow the user to override today's focus without changing the whole recurring schedule.

---

# 22. Minimum Viable Day

Create a special mode/button:

## Low Energy Day

When activated, reduce today's expectations.

Display:

### Career

25 minutes

Choose one:

* one Leetcode problem
* one application
* one small project task
* one system design topic

### Body

20 minutes

Choose one:

* walk
* mobility
* light workout
* casual basketball

### Life

At least 30 minutes

Examples:

* family
* girlfriend
* coffee
* outside
* entertainment
* rest

Explain:

A low-energy day is not a failed day.

Consistency at reduced intensity is better than alternating between extreme productivity and complete avoidance.

---

# 23. Daily Shutdown

Create a simple nightly shutdown component.

Default time:

10:15 PM

Ask two questions.

## Done Today

Short text area.

Example:

* Worked
* Gym
* Solved sliding-window problem

## Tomorrow's One Important Thing

One text input.

Example:

Submit Wealthsimple application.

After saving, show:

> Today's work is finished.

The purpose is psychologically closing the day instead of mentally carrying unfinished work into bed.

---

# 24. Sleep

Default sleep target:

11:00 PM – 6:15 AM

Long-term preferred target:

approximately 7.5 hours or more.

Display bedtime and wake time in Settings.

Do not add complex sleep tracking.

The purpose is maintaining stable anchors.

The application should reinforce:

Do not steal sleep to create additional productive hours.

Morning exercise requires adequate sleep.

---

# 25. Weekly Review

Sunday should contain a simple review.

Ask:

### What went well this week?

Text area.

### What created friction?

Text area.

### What did I repeatedly avoid?

Text area.

### What should change next week?

Text area.

Then display statistics:

* Physical sessions completed
* Focus sessions completed
* Applications submitted
* Project milestones completed
* Leetcode sessions completed
* System design sessions completed

Avoid excessive analytics.

The purpose is learning, not grading myself.

---

# 26. Success Indicator

Create a simple daily success calculation.

Weekday success should primarily consider:

* Body completed
* Workday completed
* Future focus completed

If all three are done:

Display prominently:

## Day Complete

You've done enough today.

If two out of three are complete:

Display:

## Solid Day

One area remains, but the day is not a failure.

Do not use red failure indicators.

Weekends should not require the workday condition.

---

# 27. Progress History

Create a simple calendar or history page within Today or Weekly Review.

Each date should show a small status:

* Complete
* Solid
* Recovery
* Low Energy
* Rest

Clicking a day should show:

* physical activity
* evening focus
* focus note
* shutdown note

Do not implement complicated streak mechanics.

Avoid messages like:

"You broke your 14-day streak."

Missing one day should not psychologically reset progress.

---

# 28. Settings

Allow editing:

* wake time
* bedtime
* work start
* work end
* commute/home time
* decompression duration
* focus block time
* free-life block
* weekly physical schedule
* weekly evening focus schedule
* weekly application target

Include:

## Reset Sample Data

and:

## Export Data

Export all localStorage data as JSON.

Also allow:

## Import Data

Upload previously exported JSON.

---

# 29. Seed Data

Populate the application with the following default schedule.

### Monday

Morning: Gym
Evening: Leetcode

### Tuesday

Morning: Basketball
Evening: GitHub / AI Project

### Wednesday

Morning: Recovery
Evening: System Design

### Thursday

Morning: Gym
Evening: Internship Applications

### Friday

Morning: Basketball
Evening: Admin / Catch-up

### Saturday

Morning: Flexible Basketball / Gym
Evening: Project + Applications

### Sunday

Morning: Rest
Evening: School PM + Weekly Review

---

# 30. Visual Design

The design should feel:

* calm
* simple
* spacious
* practical
* non-corporate
* non-gamified

Use:

* cards
* subtle borders
* readable typography
* generous spacing
* restrained colors
* clear completion states

Avoid:

* gradients everywhere
* excessive animation
* productivity-game aesthetics
* XP
* levels
* badges
* aggressive streaks
* confetti
* crowded dashboards

Dark mode is optional but welcome if easy.

---

# 31. UX Priorities

The most important user experience is:

Open application.

Immediately see:

1. What physical activity am I doing today, and when?
2. What is my one important evening objective?
3. What does the rest of my day look like?
4. Have I done enough for today?

It should take no more than a few seconds to answer those questions.

Adding or completing a task should normally require one or two clicks.

Do not bury routine information inside settings or menus.

---

# 32. Important Product Principles

Implement the product around these principles.

### Principle 1

One major productive objective per weekday evening.

### Principle 2

Physical activity belongs primarily in the morning.

### Principle 3

Decompression after work is protected.

### Principle 4

Relationships and free time are part of a healthy life.

### Principle 5

Career progress is measured weekly, not by maximizing every day.

### Principle 6

Low-energy days still count.

### Principle 7

Sleep should not be sacrificed for productivity.

### Principle 8

The system should reduce mental load, not create additional management overhead.

### Principle 9

The application should help me stop working, not only start working.

### Principle 10

Consistency beats intensity.

### Principle 11

Adaptation is better than abandonment. If the normal routine becomes unrealistic for a particular day, switch to an alternate timeline while preserving the day's important priorities.

---

# 33. Components

Suggested reusable React components:

* Sidebar
* TodayHeader
* DailyWinCard
* DailyTimeline
* PhysicalCard
* FocusObjectiveCard
* FocusTimer
* WeeklyPriorityCard
* ApplicationTracker
* ProjectCard
* LeetcodeTracker
* SystemDesignTracker
* MentalLoadInbox
* LowEnergyMode
* ShutdownCard
* WeeklyReviewForm
* ProgressHistory
* SettingsForm

Keep components reasonably small.

---

# 34. Suggested Data Model

Use TypeScript interfaces.

Example conceptual structures:

```ts
type PhysicalType =
  | "gym"
  | "basketball"
  | "recovery"
  | "rest"
  | "flexible";

type FocusCategory =
  | "leetcode"
  | "system-design"
  | "project"
  | "applications"
  | "school"
  | "admin";

interface DailyEntry {
  date: string;
  timelineMode: "normal" | "late-wake";
  energyMode: "normal" | "low";
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

interface WeeklyPriority {
  id: string;
  text: string;
  completed: boolean;
}

interface Application {
  id: string;
  company: string;
  role: string;
  location?: string;
  url?: string;
  dateApplied?: string;
  status: string;
  referral?: string;
  notes?: string;
  nextAction?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  milestone?: string;
  nextAction: string;
  repositoryUrl?: string;
  status: "active" | "paused" | "complete";
}
```

Create additional interfaces as needed.

---

# 35. Persistence

Create a clean storage layer around localStorage.

Do not directly scatter localStorage calls throughout every component.

Example:

```ts
getAppState()
saveAppState()
exportAppState()
importAppState()
resetAppState()
```

On first load, initialize seed data.

Do not overwrite existing stored data during future reloads.

---

# 36. Date Behavior

Use the user's local timezone.

Automatically determine the current day of the week.

Generate today's defaults from the recurring weekly routine.

Historical daily entries must remain unchanged if the recurring routine is later edited.

---

# 37. Empty States

Every section should have useful empty states.

Example Projects:

No active project yet.

Add the project you currently want to move forward.

Example Applications:

No applications recorded this week.

Your goal is consistent, high-quality applications rather than mass applying.

Do not use guilt-based wording.

---

# 38. Acceptance Criteria

The implementation is complete when:

1. The app launches successfully.
2. All pages are accessible.
3. Data persists after refresh.
4. The Today page automatically reflects the current weekday.
5. Physical activity is scheduled in the morning.
6. Exactly one primary evening focus is emphasized.
7. Daily success can be marked.
8. Focus sessions can be run.
9. Applications can be added and updated.
10. Leetcode entries can be added and reviewed.
11. System design topics can be tracked.
12. Projects can be created with a next action.
13. School PM tasks can be tracked.
14. Admin tasks can be captured.
15. Mental-load items can be captured quickly.
16. Low Energy Mode works.
17. Weekly three priorities work.
18. Daily shutdown entries persist.
19. Weekly review entries persist.
20. Settings can modify the recurring routine.
21. Data can be exported and imported as JSON.
22. The interface remains simple and uncluttered.
23. There are no authentication or backend requirements.
24. There are no obvious TypeScript or console errors.
25. Today can switch independently between Normal/Late Wake timelines and Normal/Low Energy intensity.
26. Timeline switching preserves the day's activity choices, completion state, objective, and notes.
27. Normal and Late Wake timeline presets and the default weekday timeline can be edited in Settings.

---

# 39. Implementation Instruction

Build the entire working application, not just mockups.

Create all required files and components.

After implementation:

1. Run the application's lint/type-check/build commands.
2. Fix any errors.
3. Ensure the app launches.
4. Verify localStorage persistence.
5. Verify navigation.
6. Verify today's routine generation.
7. Verify creating and editing entries.
8. Leave the repository in a runnable state.

Prioritize reliable functionality and maintainable code over elaborate visual design.

If a minor design decision is unspecified, choose the simplest reasonable implementation rather than stopping to ask questions.
