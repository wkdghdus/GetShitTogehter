"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { createId } from "@/lib/defaults";
import type { ProjectStatus, TaskStatus } from "@/lib/types";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, SectionHeader, Select, Textarea } from "@/components/ui";

const PROJECT_STATUSES: ProjectStatus[] = ["active", "paused", "complete"];
const TASK_STATUSES: TaskStatus[] = ["not-started", "in-progress", "blocked", "complete"];
const label = (value: string) => value.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

export function ProjectsPage() {
  const { state, isHydrated, setState } = useAppState();
  const [showForm, setShowForm] = useState(false);

  if (!isHydrated || !state) return <p className="text-[color:var(--muted)]">Loading projects…</p>;

  const addProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const nextAction = String(data.get("nextAction") ?? "").trim();
    if (!name || !nextAction) return;
    const optional = (field: string) => String(data.get(field) ?? "").trim() || undefined;
    setState((current) => ({
      ...current,
      projects: [
        {
          id: createId("project"),
          name,
          description: optional("description"),
          milestone: optional("milestone"),
          nextAction,
          repositoryUrl: optional("repositoryUrl"),
          status: "active",
          tasks: [],
        },
        ...current.projects,
      ],
    }));
    form.reset();
    setShowForm(false);
  };

  const updateProject = (id: string, patch: { status?: ProjectStatus; nextAction?: string; milestone?: string }) => {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === id ? {
        ...project,
        ...patch,
        completedAt: patch.status === "complete"
          ? project.completedAt ?? new Date().toISOString()
          : patch.status
            ? undefined
            : project.completedAt,
      } : project),
    }));
  };

  const addTask = (event: FormEvent<HTMLFormElement>, projectId: string) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const task = String(data.get("task") ?? "").trim();
    if (!task) return;
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === projectId ? {
        ...project,
        tasks: [...project.tasks, { id: createId("project-task"), task, status: "not-started" }],
      } : project),
    }));
    form.reset();
  };

  const updateTask = (projectId: string, taskId: string, status: TaskStatus) => {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === projectId ? {
        ...project,
        tasks: project.tasks.map((task) => task.id === taskId ? { ...task, status } : task),
      } : project),
    }));
  };

  return (
    <div>
      <SectionHeader
        eyebrow="GitHub / AI work"
        title="Projects"
        description="Success is one meaningful shipped improvement per week—not hours accumulated."
        action={<Button onClick={() => setShowForm((open) => !open)}>{showForm ? "Close form" : "Add project"}</Button>}
      />

      {showForm ? (
        <Card className="mb-5">
          <CardHeader title="New project" description="Name the work, then make the very next action concrete." />
          <form onSubmit={addProject} className="grid gap-4 md:grid-cols-2">
            <Field label="Project name"><Input name="name" required /></Field>
            <Field label="Current milestone"><Input name="milestone" /></Field>
            <Field label="Next meaningful action" className="md:col-span-2"><Input name="nextAction" required placeholder="Add evaluation script for retrieval quality" /></Field>
            <Field label="Repository URL"><Input name="repositoryUrl" type="url" /></Field>
            <Field label="Description"><Textarea name="description" className="min-h-24" /></Field>
            <div className="md:col-span-2"><Button type="submit">Save project</Button></div>
          </form>
        </Card>
      ) : null}

      {state.projects.length === 0 ? (
        <EmptyState title="No active project yet" description="Add the project you currently want to move forward." action={<Button onClick={() => setShowForm(true)}>Add project</Button>} />
      ) : (
        <div className="space-y-5">
          {state.projects.map((project) => (
            <Card key={project.id} tone={project.status === "complete" ? "success" : "default"}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold text-[color:var(--text)]">{project.name}</h2>
                    <Badge tone={project.status === "complete" ? "success" : "neutral"}>{label(project.status)}</Badge>
                  </div>
                  {project.description ? <p className="mt-2 text-sm text-[color:var(--muted)]">{project.description}</p> : null}
                </div>
                {project.repositoryUrl ? <a className="text-sm font-bold text-[color:var(--primary)] underline" href={project.repositoryUrl} target="_blank" rel="noreferrer">Repository</a> : null}
              </div>

              <div className="mt-5 rounded-xl border border-[color:var(--border)] bg-[color:var(--primary-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">Next Meaningful Action</p>
                <Input className="mt-2" value={project.nextAction} onChange={(event) => updateProject(project.id, { nextAction: event.target.value })} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Current milestone"><Input value={project.milestone ?? ""} onChange={(event) => updateProject(project.id, { milestone: event.target.value || undefined })} /></Field>
                <Field label="Status">
                  <Select value={project.status} onChange={(event) => updateProject(project.id, { status: event.target.value as ProjectStatus })}>
                    {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                  </Select>
                </Field>
              </div>

              <div className="mt-6 border-t border-[color:var(--border)] pt-5">
                <h3 className="font-bold text-[color:var(--text)]">Project tasks</h3>
                <p className="mt-1 text-sm text-[color:var(--muted)]">Tasks support the next action; they are not the main measure of progress.</p>
                <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => addTask(event, project.id)}>
                  <Input name="task" placeholder="Add a supporting task" />
                  <Button type="submit">Add task</Button>
                </form>
                <div className="mt-3 space-y-2">
                  {project.tasks.map((task) => (
                    <div key={task.id} className="grid gap-2 rounded-lg bg-[color:var(--surface-muted)] p-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
                      <span className={task.status === "complete" ? "text-[color:var(--muted)] line-through" : "font-medium"}>{task.task}</span>
                      <Select value={task.status} onChange={(event) => updateTask(project.id, task.id, event.target.value as TaskStatus)} aria-label={`Status for ${task.task}`}>
                        {TASK_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                      </Select>
                    </div>
                  ))}
                  {project.tasks.length === 0 ? <p className="text-sm text-[color:var(--muted)]">No supporting tasks yet.</p> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
