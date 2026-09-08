"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { orderedWeekdayEntries } from "@/lib/defaults";
import type { AppSettings, FocusCategory, PhysicalType, TimelineItem, Weekday, WeeklyRoutineDay } from "@/lib/types";
import { Badge, Button, Card, CardHeader, Field, Input, SectionHeader, Select } from "@/components/ui";

const PHYSICAL_TYPES: PhysicalType[] = ["gym", "basketball", "recovery", "rest", "flexible"];
const FOCUS_CATEGORIES: FocusCategory[] = ["leetcode", "system-design", "project", "applications", "school", "admin"];
const display = (value: string) => value.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

export function SettingsPage() {
  const { state, isHydrated, setState, resetState, exportState, importState } = useAppState();
  const [message, setMessage] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  if (!isHydrated || !state) return <p className="text-[color:var(--muted)]">Loading settings…</p>;

  const updateSettings = (patch: Partial<AppSettings>) => setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  const updateRoutine = (weekday: Weekday, patch: Partial<WeeklyRoutineDay>) => setState((current) => ({ ...current, settings: { ...current.settings, weeklyRoutine: { ...current.settings.weeklyRoutine, [weekday]: { ...current.settings.weeklyRoutine[weekday], ...patch } } } }));
  const updateTimeline = (id: string, patch: Partial<TimelineItem>) => setState((current) => ({ ...current, settings: { ...current.settings, timelineTemplate: current.settings.timelineTemplate.map((item) => item.id === id ? { ...item, ...patch } : item) } }));

  const downloadExport = () => {
    const blob = new Blob([exportState()], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `routine-dashboard-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); setMessage({ tone: "success", text: "Data exported." });
  };
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { importState(await file.text()); setMessage({ tone: "success", text: "Data imported successfully." }); }
    catch (error) { setMessage({ tone: "warning", text: error instanceof Error ? error.message : "Could not import that file." }); }
    event.target.value = "";
  };
  const reset = () => {
    if (!window.confirm("Replace all current dashboard data with the sample schedule? Export first if you need a backup.")) return;
    resetState(); setMessage({ tone: "success", text: "Sample data restored." });
  };

  return <div>
    <SectionHeader eyebrow="Recurring routine" title="Settings" description="Adjust the anchors that shape future days. Existing daily history stays unchanged." action={message ? <Badge tone={message.tone}>{message.text}</Badge> : undefined} />
    <Card className="mb-8"><CardHeader title="Daily anchors" description="Protect sleep, work boundaries, decompression, focus, and free life." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Wake time"><Input type="time" value={state.settings.wakeTime} onChange={(event) => updateSettings({ wakeTime: event.target.value })} /></Field>
      <Field label="Bedtime"><Input type="time" value={state.settings.bedtime} onChange={(event) => updateSettings({ bedtime: event.target.value })} /></Field>
      <Field label="Work start"><Input type="time" value={state.settings.workStart} onChange={(event) => updateSettings({ workStart: event.target.value })} /></Field>
      <Field label="Work end"><Input type="time" value={state.settings.workEnd} onChange={(event) => updateSettings({ workEnd: event.target.value })} /></Field>
      <Field label="Commute / home time"><Input type="time" value={state.settings.commuteHomeTime} onChange={(event) => updateSettings({ commuteHomeTime: event.target.value })} /></Field>
      <Field label="Decompression minutes"><Input type="number" min={0} max={180} value={state.settings.decompressionDurationMinutes} onChange={(event) => updateSettings({ decompressionDurationMinutes: Number(event.target.value) })} /></Field>
      <Field label="Focus starts"><Input type="time" value={state.settings.focusBlockStart} onChange={(event) => updateSettings({ focusBlockStart: event.target.value })} /></Field>
      <Field label="Focus ends"><Input type="time" value={state.settings.focusBlockEnd} onChange={(event) => updateSettings({ focusBlockEnd: event.target.value })} /></Field>
      <Field label="Free Life starts"><Input type="time" value={state.settings.freeLifeStart} onChange={(event) => updateSettings({ freeLifeStart: event.target.value })} /></Field>
      <Field label="Free Life ends"><Input type="time" value={state.settings.freeLifeEnd} onChange={(event) => updateSettings({ freeLifeEnd: event.target.value })} /></Field>
      <Field label="Weekly application target"><Input type="number" min={1} max={50} value={state.settings.weeklyApplicationTarget} onChange={(event) => updateSettings({ weeklyApplicationTarget: Number(event.target.value) })} /></Field>
    </div><div className="mt-5 rounded-xl bg-[color:var(--surface-muted)] p-4"><h3 className="font-bold">Sleep is an anchor</h3><p className="mt-1 text-sm text-[color:var(--muted)]">Do not steal sleep to create more productive hours. Morning movement requires adequate rest.</p></div></Card>

    <section className="mb-8"><SectionHeader eyebrow="Monday through Sunday" title="Weekly schedule" description="These defaults generate a new day's Body and Future cards. Overriding Today never rewrites this schedule." /><div className="space-y-4">{orderedWeekdayEntries(state.settings.weeklyRoutine).map(([weekday, routine]) => <Card key={weekday}>
      <CardHeader title={display(weekday)} description={`${routine.physicalLabel} in the morning · ${routine.focusLabel} in the evening`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Physical type"><Select value={routine.physicalType} onChange={(event) => updateRoutine(weekday, { physicalType: event.target.value as PhysicalType })}>{PHYSICAL_TYPES.map((type) => <option key={type} value={type}>{display(type)}</option>)}</Select></Field>
        <Field label="Physical label"><Input value={routine.physicalLabel} onChange={(event) => updateRoutine(weekday, { physicalLabel: event.target.value })} /></Field>
        <Field label="Physical start"><Input type="time" value={routine.physicalStart} onChange={(event) => updateRoutine(weekday, { physicalStart: event.target.value })} /></Field>
        <Field label="Physical end"><Input type="time" value={routine.physicalEnd} onChange={(event) => updateRoutine(weekday, { physicalEnd: event.target.value })} /></Field>
        <Field label="Evening category"><Select value={routine.focusCategory} onChange={(event) => updateRoutine(weekday, { focusCategory: event.target.value as FocusCategory })}>{FOCUS_CATEGORIES.map((category) => <option key={category} value={category}>{display(category)}</option>)}</Select></Field>
        <Field label="Evening label"><Input value={routine.focusLabel} onChange={(event) => updateRoutine(weekday, { focusLabel: event.target.value })} /></Field>
        <Field label="Focus start"><Input type="time" value={routine.focusStart} onChange={(event) => updateRoutine(weekday, { focusStart: event.target.value })} /></Field>
        <Field label="Focus end"><Input type="time" value={routine.focusEnd} onChange={(event) => updateRoutine(weekday, { focusEnd: event.target.value })} /></Field>
        <Field label="Default one objective" className="md:col-span-2 xl:col-span-4"><Input value={routine.focusObjective} onChange={(event) => updateRoutine(weekday, { focusObjective: event.target.value })} /></Field>
      </div>
    </Card>)}</div></section>

    <section className="mb-8"><SectionHeader eyebrow="Chronological, not a checklist" title="Timeline template" description="Edit the visible time and activity for future days. Timeline blocks never require completion." /><Card><div className="space-y-3">{state.settings.timelineTemplate.map((item) => <div key={item.id} className="grid gap-2 rounded-lg bg-[color:var(--surface-muted)] p-3 sm:grid-cols-[8rem_8rem_minmax(0,1fr)]"><Input type="time" value={item.start} onChange={(event) => updateTimeline(item.id, { start: event.target.value })} aria-label={`Start time for ${item.title}`} /><Input type="time" value={item.end ?? ""} onChange={(event) => updateTimeline(item.id, { end: event.target.value || undefined })} aria-label={`End time for ${item.title}`} /><Input value={item.title} onChange={(event) => updateTimeline(item.id, { title: event.target.value })} aria-label="Timeline activity" /></div>)}</div></Card></section>

    <section><SectionHeader eyebrow="Local data" title="Backup & reset" description="Everything stays in this browser's localStorage unless you export it." /><Card><div className="flex flex-wrap gap-3"><Button onClick={downloadExport}>Export Data</Button><label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-[color:var(--border-strong)] bg-white px-4 py-2 text-sm font-bold hover:bg-[color:var(--surface-muted)]">Import Data<input type="file" accept="application/json,.json" className="sr-only" onChange={importFile} /></label><Button variant="danger" onClick={reset}>Reset Sample Data</Button></div><p className="mt-4 text-sm text-[color:var(--muted)]">Import accepts a previously exported version 1 dashboard file and replaces current data only after validation.</p></Card></section>
  </div>;
}
