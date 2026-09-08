"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { createId } from "@/lib/defaults";
import { getWeekStart } from "@/lib/dates";
import type { Confidence, Difficulty, LeetcodeEntry, LeetcodeStatus, SystemDesignEntry } from "@/lib/types";
import { Badge, Button, Card, EmptyState, Field, Input, SectionHeader, Select, SimpleGrid, Textarea } from "@/components/ui";

const PATTERNS = ["Arrays", "Hash maps", "Two pointers", "Sliding window", "Binary search", "Stack", "Linked list", "Trees", "Graphs", "Heap", "Backtracking", "Dynamic programming", "Greedy", "Intervals"];
const DESIGN_TOPICS = ["Load balancing", "Caching", "Databases", "Replication", "Partitioning", "Message queues", "APIs", "Rate limiting", "Consistency", "Distributed systems", "Search", "Object storage", "CDN", "Observability"];
const CONFIDENCE: Confidence[] = ["weak", "developing", "comfortable", "strong"];
const ENTRY_STATUSES: LeetcodeStatus[] = ["new", "solved", "review"];
const title = (value: string) => value.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

export function CareerPage() {
  const { state, todayDate, isHydrated, setState } = useAppState();
  const [form, setForm] = useState<"leetcode" | "system" | null>(null);
  const [reviewOnly, setReviewOnly] = useState(false);

  if (!isHydrated || !state) return <p className="text-[color:var(--muted)]">Loading career work…</p>;

  const weekStart = getWeekStart(todayDate);
  const leetcodeThisWeek = state.leetcodeEntries.filter((entry) => entry.datePracticed && entry.datePracticed >= weekStart).length;
  const systemThisWeek = state.systemDesignEntries.filter((entry) => entry.lastStudied && entry.lastStudied >= weekStart).length;
  const applicationsThisWeek = state.applications.filter((entry) => entry.dateApplied && entry.dateApplied >= weekStart && entry.status !== "saved").length;
  const visibleLeetcode = reviewOnly ? state.leetcodeEntries.filter((entry) => entry.status === "review") : state.leetcodeEntries;

  const addLeetcode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    const data = new FormData(element);
    const problemName = String(data.get("problemName") ?? "").trim();
    if (!problemName) return;
    const notes = String(data.get("notes") ?? "").trim();
    setState((current) => ({ ...current, leetcodeEntries: [{
      id: createId("leetcode"), problemName,
      difficulty: String(data.get("difficulty")) as Difficulty,
      pattern: String(data.get("pattern")),
      status: String(data.get("status")) as LeetcodeStatus,
      datePracticed: String(data.get("datePracticed")) || undefined,
      confidence: String(data.get("confidence")) as Confidence,
      notes: notes || undefined,
    }, ...current.leetcodeEntries] }));
    element.reset();
    setForm(null);
  };

  const addSystemDesign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    const data = new FormData(element);
    const topic = String(data.get("topic") ?? "").trim();
    if (!topic) return;
    const notes = String(data.get("notes") ?? "").trim();
    setState((current) => ({ ...current, systemDesignEntries: [{
      id: createId("system-design"), topic,
      status: String(data.get("status")) as LeetcodeStatus,
      notes: notes || undefined,
      lastStudied: String(data.get("lastStudied")) || undefined,
      confidence: String(data.get("confidence")) as Confidence,
      isPracticeCase: data.get("isPracticeCase") === "on",
    }, ...current.systemDesignEntries] }));
    element.reset();
    setForm(null);
  };

  const patchLeetcode = (id: string, patch: Partial<LeetcodeEntry>) => setState((current) => ({
    ...current, leetcodeEntries: current.leetcodeEntries.map((entry) => entry.id === id ? { ...entry, ...patch } : entry),
  }));
  const patchSystem = (id: string, patch: Partial<SystemDesignEntry>) => setState((current) => ({
    ...current, systemDesignEntries: current.systemDesignEntries.map((entry) => entry.id === id ? { ...entry, ...patch } : entry),
  }));

  return (
    <div>
      <SectionHeader eyebrow="Bounded progress" title="Career" description="Career is the highest long-term development priority. It advances through focused sessions, not endless evenings." />

      <SimpleGrid className="mb-8">
        <Card tone="quiet"><p className="text-sm text-[color:var(--muted)]">Interview prep this week</p><p className="mt-2 text-3xl font-bold">{leetcodeThisWeek + systemThisWeek}</p><p className="mt-1 text-xs text-[color:var(--muted)]">Leetcode + system design sessions</p></Card>
        <Card tone="quiet"><p className="text-sm text-[color:var(--muted)]">Project direction</p><p className="mt-2 text-3xl font-bold">{state.projects.filter((item) => item.status === "active").length}</p><p className="mt-1 text-xs text-[color:var(--muted)]">Active projects with a next action</p></Card>
        <Card tone="quiet"><p className="text-sm text-[color:var(--muted)]">Applications this week</p><p className="mt-2 text-3xl font-bold">{applicationsThisWeek}</p><p className="mt-1 text-xs text-[color:var(--muted)]">Quality entries into recruiting pipelines</p></Card>
      </SimpleGrid>

      <section className="mb-8">
        <SectionHeader eyebrow="Interview prep" title="Leetcode" description="Practice pattern recognition and clear explanations—not raw problem count." action={<div className="flex gap-2"><Button variant="secondary" onClick={() => setReviewOnly((value) => !value)}>{reviewOnly ? "Show all" : "Review queue"}</Button><Button onClick={() => setForm(form === "leetcode" ? null : "leetcode")}>Add problem</Button></div>} />
        {form === "leetcode" ? (
          <Card className="mb-4"><form onSubmit={addLeetcode} className="grid gap-4 md:grid-cols-3">
            <Field label="Problem name" className="md:col-span-2"><Input name="problemName" required /></Field>
            <Field label="Difficulty"><Select name="difficulty" defaultValue="medium"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select></Field>
            <Field label="Pattern"><Select name="pattern">{PATTERNS.map((pattern) => <option key={pattern}>{pattern}</option>)}</Select></Field>
            <Field label="Status"><Select name="status" defaultValue="new">{ENTRY_STATUSES.map((status) => <option key={status} value={status}>{title(status)}</option>)}</Select></Field>
            <Field label="Confidence"><Select name="confidence" defaultValue="developing">{CONFIDENCE.map((value) => <option key={value}>{value}</option>)}</Select></Field>
            <Field label="Date practiced"><Input name="datePracticed" type="date" defaultValue={todayDate} /></Field>
            <Field label="Notes" className="md:col-span-2"><Textarea name="notes" className="min-h-20" /></Field>
            <div className="md:col-span-3"><Button type="submit">Save problem</Button></div>
          </form></Card>
        ) : null}
        {visibleLeetcode.length === 0 ? <EmptyState title={reviewOnly ? "Review queue is clear" : "No Leetcode entries yet"} description="Add a problem when you want to retain the pattern and explanation." /> : (
          <div className="grid gap-3 lg:grid-cols-2">{visibleLeetcode.map((entry) => <Card key={entry.id}>
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{entry.problemName}</h3><p className="mt-1 text-sm text-[color:var(--muted)]">{entry.pattern} · {title(entry.difficulty)}</p></div><Badge tone={entry.status === "review" ? "accent" : entry.status === "solved" ? "success" : "neutral"}>{title(entry.status)}</Badge></div>
            <div className="mt-4 grid grid-cols-2 gap-3"><Field label="Status"><Select value={entry.status} onChange={(e) => patchLeetcode(entry.id, { status: e.target.value as LeetcodeStatus })}>{ENTRY_STATUSES.map((status) => <option key={status} value={status}>{title(status)}</option>)}</Select></Field><Field label="Confidence"><Select value={entry.confidence} onChange={(e) => patchLeetcode(entry.id, { confidence: e.target.value as Confidence })}>{CONFIDENCE.map((value) => <option key={value}>{title(value)}</option>)}</Select></Field></div>
            {entry.notes ? <p className="mt-3 text-sm text-[color:var(--muted)]">{entry.notes}</p> : null}
          </Card>)}</div>
        )}
      </section>

      <section>
        <SectionHeader eyebrow="Interview prep" title="System Design" description="Develop architectural reasoning and tradeoff communication rather than memorizing diagrams." action={<Button onClick={() => setForm(form === "system" ? null : "system")}>Add study entry</Button>} />
        {form === "system" ? <Card className="mb-4"><form onSubmit={addSystemDesign} className="grid gap-4 md:grid-cols-3">
          <Field label="Topic or practice case" className="md:col-span-2"><Input name="topic" list="design-topics" required /><datalist id="design-topics">{DESIGN_TOPICS.map((topic) => <option key={topic} value={topic} />)}</datalist></Field>
          <Field label="Last studied"><Input name="lastStudied" type="date" defaultValue={todayDate} /></Field>
          <Field label="Status"><Select name="status" defaultValue="new">{ENTRY_STATUSES.map((status) => <option key={status} value={status}>{title(status)}</option>)}</Select></Field>
          <Field label="Confidence"><Select name="confidence" defaultValue="developing">{CONFIDENCE.map((value) => <option key={value}>{title(value)}</option>)}</Select></Field>
          <label className="flex min-h-11 items-center gap-2 pt-7 text-sm font-bold"><input name="isPracticeCase" type="checkbox" /> Practice case</label>
          <Field label="Notes" className="md:col-span-3"><Textarea name="notes" className="min-h-20" /></Field>
          <div className="md:col-span-3"><Button type="submit">Save study entry</Button></div>
        </form></Card> : null}
        {state.systemDesignEntries.length === 0 ? <EmptyState title="No system design entries yet" description="Start with one topic or a practice case such as a URL shortener." /> : (
          <div className="grid gap-3 lg:grid-cols-2">{state.systemDesignEntries.map((entry) => <Card key={entry.id}>
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{entry.topic}</h3><p className="mt-1 text-sm text-[color:var(--muted)]">{entry.isPracticeCase ? "Practice case" : "Study topic"}{entry.lastStudied ? ` · ${entry.lastStudied}` : ""}</p></div><Badge>{title(entry.status)}</Badge></div>
            <div className="mt-4 grid grid-cols-2 gap-3"><Field label="Status"><Select value={entry.status} onChange={(e) => patchSystem(entry.id, { status: e.target.value as LeetcodeStatus })}>{ENTRY_STATUSES.map((status) => <option key={status} value={status}>{title(status)}</option>)}</Select></Field><Field label="Confidence"><Select value={entry.confidence} onChange={(e) => patchSystem(entry.id, { confidence: e.target.value as Confidence })}>{CONFIDENCE.map((value) => <option key={value}>{title(value)}</option>)}</Select></Field></div>
            {entry.notes ? <p className="mt-3 text-sm text-[color:var(--muted)]">{entry.notes}</p> : null}
          </Card>)}</div>
        )}
      </section>
    </div>
  );
}
