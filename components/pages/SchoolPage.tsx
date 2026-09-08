"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { createId } from "@/lib/defaults";
import type { TaskStatus } from "@/lib/types";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, SectionHeader, Select, Textarea } from "@/components/ui";

const TASK_STATUSES: TaskStatus[] = ["not-started", "in-progress", "blocked", "complete"];
const title = (value: string) => value.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

export function SchoolPage() {
  const { state, isHydrated, setState } = useAppState();
  const [showForm, setShowForm] = useState(false);
  if (!isHydrated || !state) return <p className="text-[color:var(--muted)]">Loading school projects…</p>;

  const addProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const projectName = String(data.get("projectName") ?? "").trim(); const goal = String(data.get("goal") ?? "").trim();
    if (!projectName || !goal) return;
    const optional = (key: string) => String(data.get(key) ?? "").trim() || undefined;
    setState((current) => ({ ...current, schoolProjects: [{
      id: createId("school-project"), projectName, goal, currentPhase: String(data.get("currentPhase") ?? "Planning").trim(),
      teamMembers: String(data.get("teamMembers") ?? "").split(",").map((member) => member.trim()).filter(Boolean),
      upcomingMilestone: optional("upcomingMilestone"), deadline: optional("deadline"), notes: optional("notes"), pmAttention: [], tasks: [],
    }, ...current.schoolProjects] })); form.reset(); setShowForm(false);
  };

  const addAttention = (event: FormEvent<HTMLFormElement>, projectId: string) => {
    event.preventDefault(); const form = event.currentTarget; const item = String(new FormData(form).get("attention") ?? "").trim(); if (!item) return;
    setState((current) => ({ ...current, schoolProjects: current.schoolProjects.map((project) => project.id === projectId && project.pmAttention.length < 2 ? { ...project, pmAttention: [...project.pmAttention, item] } : project) })); form.reset();
  };

  const removeAttention = (projectId: string, index: number) => setState((current) => ({
    ...current,
    schoolProjects: current.schoolProjects.map((project) => project.id === projectId
      ? { ...project, pmAttention: project.pmAttention.filter((_, itemIndex) => itemIndex !== index) }
      : project),
  }));

  const addTask = (event: FormEvent<HTMLFormElement>, projectId: string) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const task = String(data.get("task") ?? "").trim(); if (!task) return;
    const owner = String(data.get("owner") ?? "").trim() || undefined; const dueDate = String(data.get("dueDate") ?? "") || undefined;
    setState((current) => ({ ...current, schoolProjects: current.schoolProjects.map((project) => project.id === projectId ? { ...project, tasks: [...project.tasks, { id: createId("school-task"), task, owner, dueDate, status: "not-started" }] } : project) })); form.reset();
  };

  const updateTask = (projectId: string, taskId: string, status: TaskStatus) => setState((current) => ({ ...current, schoolProjects: current.schoolProjects.map((project) => project.id === projectId ? { ...project, tasks: project.tasks.map((task) => task.id === taskId ? { ...task, status } : task) } : project) }));

  return <div>
    <SectionHeader eyebrow="Project management" title="School" description="Keep PM responsibilities visible, then handle them during Sunday planning or a designated evening—not every weekday." action={<Button onClick={() => setShowForm((open) => !open)}>{showForm ? "Close form" : "Add school project"}</Button>} />
    {showForm ? <Card className="mb-5"><form onSubmit={addProject} className="grid gap-4 md:grid-cols-2">
      <Field label="Project name"><Input name="projectName" required /></Field><Field label="Current phase"><Input name="currentPhase" defaultValue="Planning" required /></Field><Field label="Goal" className="md:col-span-2"><Textarea name="goal" required /></Field><Field label="Team members" hint="Separate names with commas."><Input name="teamMembers" /></Field><Field label="Upcoming milestone"><Input name="upcomingMilestone" /></Field><Field label="Deadline"><Input name="deadline" type="date" /></Field><Field label="Notes"><Textarea name="notes" className="min-h-20" /></Field><div className="md:col-span-2"><Button type="submit">Save project</Button></div>
    </form></Card> : null}
    {state.schoolProjects.length === 0 ? <EmptyState title="No school project yet" description="Add the project that needs your PM attention; it does not need to occupy every day." action={<Button onClick={() => setShowForm(true)}>Add project</Button>} /> : <div className="space-y-5">{state.schoolProjects.map((project) => <Card key={project.id}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-bold">{project.projectName}</h2><p className="mt-1 text-sm text-[color:var(--muted)]">{project.goal}</p></div><Badge>{project.currentPhase}</Badge></div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3"><div><strong>Team</strong><p className="text-[color:var(--muted)]">{project.teamMembers.join(", ") || "Not listed"}</p></div><div><strong>Upcoming milestone</strong><p className="text-[color:var(--muted)]">{project.upcomingMilestone || "Not set"}</p></div><div><strong>Deadline</strong><p className="text-[color:var(--muted)]">{project.deadline || "No date"}</p></div></div>
      <div className="mt-6 rounded-xl bg-[color:var(--primary-soft)] p-4"><CardHeader title="PM Attention" description="Keep only one or two items that currently require you." />
        <ol className="space-y-2">{project.pmAttention.map((item, index) => <li key={`${item}-${index}`} className="flex items-center justify-between gap-3 font-medium"><span>{index + 1}. {item}</span><Button variant="ghost" onClick={() => removeAttention(project.id, index)}>Clear</Button></li>)}</ol>
        {project.pmAttention.length < 2 ? <form onSubmit={(event) => addAttention(event, project.id)} className="mt-3 flex flex-col gap-2 sm:flex-row"><Input name="attention" placeholder="Confirm dataset preprocessing ownership" /><Button type="submit" variant="secondary">Add attention item</Button></form> : <p className="mt-3 text-sm text-[color:var(--muted)]">Two items are already in focus.</p>}
      </div>
      <div className="mt-6"><h3 className="font-bold">Tasks</h3><form onSubmit={(event) => addTask(event, project.id)} className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem_10rem_auto]"><Input name="task" placeholder="Task" required /><Input name="owner" placeholder="Owner" /><Input name="dueDate" type="date" /><Button type="submit">Add</Button></form>
        <div className="mt-3 space-y-2">{project.tasks.map((task) => <div key={task.id} className="grid gap-2 rounded-lg bg-[color:var(--surface-muted)] p-3 md:grid-cols-[minmax(0,1fr)_10rem_12rem] md:items-center"><div><p className="font-medium">{task.task}</p><p className="text-xs text-[color:var(--muted)]">{task.owner || "No owner"}{task.dueDate ? ` · ${task.dueDate}` : ""}</p></div><Badge tone={task.status === "blocked" ? "warning" : task.status === "complete" ? "success" : "neutral"}>{title(task.status)}</Badge><Select value={task.status} onChange={(event) => updateTask(project.id, task.id, event.target.value as TaskStatus)} aria-label={`Status for ${task.task}`}>{TASK_STATUSES.map((status) => <option key={status} value={status}>{title(status)}</option>)}</Select></div>)}{project.tasks.length === 0 ? <p className="text-sm text-[color:var(--muted)]">No tasks yet.</p> : null}</div>
      </div>
    </Card>)}</div>}
  </div>;
}
