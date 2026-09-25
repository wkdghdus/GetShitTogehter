"use client";

import type { FormEvent } from "react";
import { useAppState } from "@/context/app-state-context";
import { createId } from "@/lib/defaults";
import type { TaskStatus, WorkTask } from "@/lib/types";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, SectionHeader, Select, Textarea } from "@/components/ui";

const COLUMNS: TaskStatus[] = ["not-started", "in-progress", "blocked", "complete"];
const title = (value: string) => value.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

export function WorkPage() {
  const { state, isHydrated, setState } = useAppState();
  if (!isHydrated || !state) return <p className="text-[color:var(--muted)]">Loading work board…</p>;

  const categories = [...new Set(state.workTasks.map((t) => t.category))];

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const category = String(data.get("category") ?? "").trim();
    if (!title || !category) return;
    const detail = String(data.get("detail") ?? "").trim() || undefined;
    setState((current) => ({
      ...current,
      workTasks: [{ id: createId("work"), title, category, detail, status: "not-started" }, ...current.workTasks],
    }));
    form.reset();
  };

  const patchTask = (id: string, patch: Partial<WorkTask>) =>
    setState((current) => ({
      ...current,
      workTasks: current.workTasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    }));

  const removeTask = (id: string) =>
    setState((current) => ({ ...current, workTasks: current.workTasks.filter((task) => task.id !== id) }));

  return (
    <div>
      <SectionHeader
        eyebrow="Backlog, not a daily checkbox"
        title="Work Board"
        description="A day-independent kanban for work responsibilities. Separate from Today's workday block."
      />
      <Card className="mb-5">
        <CardHeader title="Capture a task" description="Title and category are required." />
        <form onSubmit={addTask} className="grid gap-3 md:grid-cols-2">
          <Field label="Title"><Input name="title" placeholder="Ship the migration" required /></Field>
          <Field label="Category">
            <Input name="category" placeholder="Platform" list="work-categories" required />
            <datalist id="work-categories">
              {categories.map((category) => <option key={category} value={category} />)}
            </datalist>
          </Field>
          <Field label="Detail" className="md:col-span-2"><Textarea name="detail" className="min-h-20" /></Field>
          <Button type="submit" className="md:col-span-2 md:w-fit">Capture</Button>
        </form>
      </Card>
      {state.workTasks.length === 0 ? (
        <EmptyState title="Work board is empty" description="Capture a work responsibility to start tracking it here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((status) => {
            const tasks = state.workTasks.filter((task) => task.status === status);
            return (
              <Card key={status} tone={status === "complete" ? "success" : "default"}>
                <CardHeader title={title(status)} description={`${tasks.length} item${tasks.length === 1 ? "" : "s"}`} />
                {tasks.length === 0 ? (
                  <p className="text-sm text-[color:var(--muted)]">No tasks here.</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="rounded-lg border border-[color:var(--border)] p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={task.status === "complete" ? "font-bold text-[color:var(--muted)] line-through" : "font-bold"}>
                            {task.title}
                          </h3>
                          <Badge tone="accent">{task.category}</Badge>
                          {status === "blocked" ? <Badge tone="warning">Blocked</Badge> : null}
                        </div>
                        {task.detail ? <p className="mt-2 text-sm">{task.detail}</p> : null}
                        <div className="mt-3 grid gap-2">
                          <Field label="Status">
                            <Select
                              value={task.status}
                              onChange={(event) => patchTask(task.id, { status: event.target.value as TaskStatus })}
                            >
                              {COLUMNS.map((column) => <option key={column} value={column}>{title(column)}</option>)}
                            </Select>
                          </Field>
                          <Button type="button" variant="ghost" onClick={() => removeTask(task.id)}>Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
