"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { createId } from "@/lib/defaults";
import type { AdminTask } from "@/lib/types";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, SectionHeader, Select, Textarea } from "@/components/ui";

type AdminStatus = AdminTask["status"];
const STATUSES: AdminStatus[] = ["not-started", "in-progress", "complete"];
const title = (value: string) => value.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

export function AdminPage() {
  const { state, isHydrated, setState } = useAppState();
  const [showDetails, setShowDetails] = useState(false);
  if (!isHydrated || !state) return <p className="text-[color:var(--muted)]">Loading admin inbox…</p>;

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const task = String(data.get("task") ?? "").trim(); if (!task) return;
    const dueDate = String(data.get("dueDate") ?? "") || undefined; const notes = String(data.get("notes") ?? "").trim() || undefined;
    setState((current) => ({ ...current, adminInbox: [{ id: createId("admin"), task, dueDate, notes, status: "not-started" }, ...current.adminInbox] })); form.reset(); setShowDetails(false);
  };
  const patchTask = (id: string, patch: Partial<AdminTask>) => setState((current) => ({ ...current, adminInbox: current.adminInbox.map((task) => task.id === id ? { ...task, ...patch } : task) }));

  return <div>
    <SectionHeader eyebrow="Catch-up without clutter" title="Admin" description="Capture email, appointments, paperwork, bookings, finances, forms, errands, and household work. Friday is the default catch-up evening." />
    <Card className="mb-5">
      <CardHeader title="Admin Inbox" description="Capture quickly. These items stay off Today unless you deliberately choose Admin as the primary focus." />
      <form onSubmit={addTask} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
        <Field label="Task"><Input name="task" placeholder="Book dentist appointment" required /></Field>
        <Button type="button" variant="secondary" onClick={() => setShowDetails((open) => !open)}>{showDetails ? "Hide details" : "Add details"}</Button>
        <Button type="submit">Capture</Button>
        {showDetails ? <><Field label="Optional due date"><Input name="dueDate" type="date" /></Field><Field label="Notes" className="md:col-span-2"><Textarea name="notes" className="min-h-20" /></Field></> : null}
      </form>
    </Card>
    {state.adminInbox.length === 0 ? <EmptyState title="Admin inbox is clear" description="When a small responsibility appears, capture it here so it does not need mental rehearsal." /> : <div className="space-y-3">{state.adminInbox.map((task) => <Card key={task.id} tone={task.status === "complete" ? "success" : "default"}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem] md:items-start"><div><div className="flex flex-wrap items-center gap-2"><h2 className={task.status === "complete" ? "font-bold text-[color:var(--muted)] line-through" : "font-bold"}>{task.task}</h2><Badge tone={task.status === "complete" ? "success" : "neutral"}>{title(task.status)}</Badge></div>{task.dueDate ? <p className="mt-1 text-sm text-[color:var(--muted)]">Due {task.dueDate}</p> : null}{task.notes ? <p className="mt-3 text-sm">{task.notes}</p> : null}</div><Field label="Status"><Select value={task.status} onChange={(event) => patchTask(task.id, { status: event.target.value as AdminStatus })}>{STATUSES.map((status) => <option key={status} value={status}>{title(status)}</option>)}</Select></Field></div>
    </Card>)}</div>}
  </div>;
}
