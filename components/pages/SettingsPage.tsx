"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { orderedWeekdayEntries } from "@/lib/defaults";
import type {
  AppSettings,
  FocusCategory,
  PhysicalType,
  TimelineItem,
  TimelineMode,
  TimelinePreset,
  Weekday,
  WeeklyRoutineDay,
} from "@/lib/types";
import { Badge, Button, Card, CardHeader, Field, Input, SectionHeader, Select } from "@/components/ui";

const PHYSICAL_TYPES: PhysicalType[] = ["gym", "basketball", "recovery", "rest", "flexible"];
const FOCUS_CATEGORIES: FocusCategory[] = [
  "leetcode",
  "system-design",
  "project",
  "applications",
  "school",
  "admin",
];
const MANUAL_TIMELINE_MODES: Array<Exclude<TimelineMode, "adaptive">> = ["normal", "late-wake"];

const display = (value: string) =>
  value
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

function TimelinePresetEditor({
  preset,
  onChange,
}: {
  preset: TimelinePreset;
  onChange: (id: string, patch: Partial<TimelineItem>) => void;
}) {
  return (
    <Card>
      <CardHeader
        title={preset.name}
        description={
          preset.id === "normal"
            ? "The preferred routine: body in the morning and future focus in the evening."
            : "A full, valid day with physical activity moved behind protected decompression."
        }
      />
      <div className="space-y-3">
        {preset.blocks.map((item) => (
          <div
            key={item.id}
            className="grid gap-2 rounded-lg bg-[color:var(--surface-muted)] p-3 sm:grid-cols-[7rem_7rem_minmax(0,1fr)_auto] sm:items-center"
          >
            <Input
              type="time"
              value={item.start}
              onChange={(event) => onChange(item.id, { start: event.target.value })}
              aria-label={`Start time for ${item.title}`}
            />
            <Input
              type="time"
              value={item.end ?? ""}
              onChange={(event) => onChange(item.id, { end: event.target.value || undefined })}
              aria-label={`End time for ${item.title}`}
            />
            <Input
              value={item.title}
              onChange={(event) => onChange(item.id, { title: event.target.value })}
              aria-label="Timeline activity"
            />
            <Badge>{display(item.kind)}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SettingsPage() {
  const { state, isHydrated, setState, resetState, exportState, importState } = useAppState();
  const [message, setMessage] = useState<{ tone: "success" | "warning"; text: string } | null>(null);

  if (!isHydrated || !state) {
    return <p className="text-[color:var(--muted)]">Loading settings…</p>;
  }

  const updateSettings = (patch: Partial<AppSettings>) => {
    setState((current) => ({
      ...current,
      settings: { ...current.settings, ...patch },
    }));
  };

  const updateRoutine = (weekday: Weekday, patch: Partial<WeeklyRoutineDay>) => {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        weeklyRoutine: {
          ...current.settings.weeklyRoutine,
          [weekday]: { ...current.settings.weeklyRoutine[weekday], ...patch },
        },
      },
    }));
  };

  const updateTimeline = (mode: Exclude<TimelineMode, "adaptive">, id: string, patch: Partial<TimelineItem>) => {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        timelinePresets: {
          ...current.settings.timelinePresets,
          [mode]: {
            ...current.settings.timelinePresets[mode],
            blocks: current.settings.timelinePresets[mode].blocks.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          },
        },
      },
    }));
  };

  const downloadExport = () => {
    const blob = new Blob([exportState()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `routine-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ tone: "success", text: "Data exported." });
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      importState(await file.text());
      setMessage({ tone: "success", text: "Data imported successfully." });
    } catch (error) {
      setMessage({
        tone: "warning",
        text: error instanceof Error ? error.message : "Could not import that file.",
      });
    }
    event.target.value = "";
  };

  const reset = () => {
    if (!window.confirm("Replace all current dashboard data with the sample schedule? Export first if you need a backup.")) {
      return;
    }
    resetState();
    setMessage({ tone: "success", text: "Sample data restored." });
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Recurring routine"
        title="Settings"
        description="Adjust the templates that shape future days. Existing daily history stays unchanged."
        action={message ? <Badge tone={message.tone}>{message.text}</Badge> : undefined}
      />

      <Card className="mb-8">
        <CardHeader
          title="Routine defaults"
          description="Choose how new weekdays begin. Today can always be changed without rewriting this default."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default weekday timeline">
            <Select
              value={state.settings.defaultTimelineMode}
              onChange={(event) => updateSettings({ defaultTimelineMode: event.target.value as TimelineMode })}
            >
              <option value="adaptive">Adaptive</option>
              <option value="normal">Normal Day</option>
              <option value="late-wake">Late Wake Day</option>
            </Select>
          </Field>
          <Field label="Weekly application target">
            <Input
              type="number"
              min={1}
              max={50}
              value={state.settings.weeklyApplicationTarget}
              onChange={(event) => updateSettings({ weeklyApplicationTarget: Number(event.target.value) })}
            />
          </Field>
          <Field label="Maximum automatic bedtime delay">
            <Input
              type="number"
              min={0}
              max={30}
              value={state.settings.maximumAutomaticBedtimeDelayMinutes}
              onChange={(event) => updateSettings({ maximumAutomaticBedtimeDelayMinutes: Number(event.target.value) })}
            />
          </Field>
        </div>
        <div className="mt-5 rounded-xl bg-[color:var(--surface-muted)] p-4">
          <h3 className="font-bold">Adaptation is better than abandonment</h3>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Late Wake Day is a legitimate routine, not a warning state. It never activates automatically from the clock.
          </p>
        </div>
      </Card>

      <section className="mb-8">
        <SectionHeader
          eyebrow="Monday through Sunday"
          title="Weekly priorities"
          description="These defaults choose each day's Body and Future activities. Timeline presets control when they happen."
        />
        <div className="space-y-4">
          {orderedWeekdayEntries(state.settings.weeklyRoutine).map(([weekday, routine]) => (
            <Card key={weekday}>
              <CardHeader
                title={display(weekday)}
                description={`${routine.physicalLabel} · ${routine.focusLabel}`}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Physical type">
                  <Select
                    value={routine.physicalType}
                    onChange={(event) => updateRoutine(weekday, { physicalType: event.target.value as PhysicalType })}
                  >
                    {PHYSICAL_TYPES.map((type) => (
                      <option key={type} value={type}>{display(type)}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Physical label">
                  <Input
                    value={routine.physicalLabel}
                    onChange={(event) => updateRoutine(weekday, { physicalLabel: event.target.value })}
                  />
                </Field>
                <Field label="Future category">
                  <Select
                    value={routine.focusCategory}
                    onChange={(event) => updateRoutine(weekday, { focusCategory: event.target.value as FocusCategory })}
                  >
                    {FOCUS_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{display(category)}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Future label">
                  <Input
                    value={routine.focusLabel}
                    onChange={(event) => updateRoutine(weekday, { focusLabel: event.target.value })}
                  />
                </Field>
                <Field label="Default one objective" className="md:col-span-2">
                  <Input
                    value={routine.focusObjective}
                    onChange={(event) => updateRoutine(weekday, { focusObjective: event.target.value })}
                  />
                </Field>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <SectionHeader
          eyebrow="Chronological, not a checklist"
          title="Timeline presets"
          description="Edit both valid schedules for future days. Body and Future labels come from the weekly priorities above."
        />
        <div className="space-y-5">
          {MANUAL_TIMELINE_MODES.map((mode) => (
            <TimelinePresetEditor
              key={mode}
              preset={state.settings.timelinePresets[mode]}
              onChange={(id, patch) => updateTimeline(mode, id, patch)}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="Local data"
          title="Backup & reset"
          description="Everything stays in this browser's localStorage unless you export it."
        />
        <Card>
          <div className="flex flex-wrap gap-3">
            <Button onClick={downloadExport}>Export Data</Button>
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-[color:var(--border-strong)] bg-white px-4 py-2 text-sm font-bold hover:bg-[color:var(--surface-muted)]">
              Import Data
              <input type="file" accept="application/json,.json" className="sr-only" onChange={importFile} />
            </label>
            <Button variant="danger" onClick={reset}>Reset Sample Data</Button>
          </div>
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            Import accepts a previously exported version 1 dashboard file and migrates legacy timelines safely.
          </p>
        </Card>
      </section>
    </div>
  );
}
