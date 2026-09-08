"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { createId } from "@/lib/defaults";
import { getWeekStart } from "@/lib/dates";
import type { BasketballSessionType } from "@/lib/types";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, SectionHeader, Select, SimpleGrid, Textarea } from "@/components/ui";

const BASKETBALL_TYPES: BasketballSessionType[] = ["shooting", "ball-handling", "finishing", "footwork", "pickup", "mixed-practice"];
const format = (value: string) => value.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

export function PhysicalPage() {
  const { state, todayDate, isHydrated, setState } = useAppState();
  const [showTemplate, setShowTemplate] = useState(false);
  const [showBasketball, setShowBasketball] = useState(false);

  if (!isHydrated || !state) return <p className="text-[color:var(--muted)]">Loading physical routine…</p>;

  const weekStart = getWeekStart(todayDate);
  const completedThisWeek = Object.values(state.dailyEntries).filter((entry) => entry.date >= weekStart && entry.physicalCompleted).length;
  const basketballThisWeek = state.basketballSessions.filter((session) => session.date >= weekStart).length;

  const addTemplate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (!name) return;
    setState((current) => ({ ...current, workoutTemplates: [...current.workoutTemplates, { id: createId("workout-template"), name, exercises: [] }] }));
    form.reset(); setShowTemplate(false);
  };

  const addExercise = (event: FormEvent<HTMLFormElement>, templateId: string) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const exercise = String(data.get("exercise") ?? "").trim();
    if (!exercise) return;
    const optional = (field: string) => String(data.get(field) ?? "").trim() || undefined;
    setState((current) => ({ ...current, workoutTemplates: current.workoutTemplates.map((template) => template.id === templateId ? {
      ...template, exercises: [...template.exercises, {
        id: createId("exercise"), exercise, sets: String(data.get("sets") ?? "").trim(), reps: String(data.get("reps") ?? "").trim(), weight: optional("weight"), notes: optional("notes"),
      }],
    } : template) }));
    form.reset();
  };

  const addBasketball = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const note = String(data.get("note") ?? "").trim();
    setState((current) => ({ ...current, basketballSessions: [{ id: createId("basketball"), date: String(data.get("date")) || todayDate, type: String(data.get("type")) as BasketballSessionType, note: note || undefined }, ...current.basketballSessions] }));
    form.reset(); setShowBasketball(false);
  };

  return (
    <div>
      <SectionHeader eyebrow="Consistency, not obsession" title="Physical" description="Morning movement supports health, athleticism, basketball, and the rest of the routine. Completing the session matters more than perfect logging." />

      <SimpleGrid className="mb-8 xl:grid-cols-4">
        <Card tone="quiet"><CardHeader title="Gym" description="General strength, athleticism, basketball performance, and injury prevention." /><Badge tone="accent">Target: 2 / week</Badge></Card>
        <Card tone="quiet"><CardHeader title="Basketball" description="Training, skill development, mental reset, outside time, and genuine enjoyment." /><Badge tone="accent">Target: 2–3 / week</Badge></Card>
        <Card tone="quiet"><CardHeader title="Recovery" description="Walking, mobility, stretching, light shooting, easy outdoor activity, or extra sleep." /><p className="text-sm font-bold text-[color:var(--success)]">Recovery counts as success.</p></Card>
        <Card tone="quiet"><CardHeader title="Rest" description="Rest is intentional. Sunday normally has no required workout." /><p className="text-sm text-[color:var(--muted)]">It supports consistency and performance.</p></Card>
      </SimpleGrid>

      <SimpleGrid className="mb-8 xl:grid-cols-2">
        <Card><p className="text-sm text-[color:var(--muted)]">Routine followed this week</p><p className="mt-2 text-4xl font-bold">{completedThisWeek}</p><p className="mt-1 text-sm text-[color:var(--muted)]">Completed morning physical or recovery blocks</p></Card>
        <Card><p className="text-sm text-[color:var(--muted)]">Basketball sessions logged</p><p className="mt-2 text-4xl font-bold">{basketballThisWeek}</p><p className="mt-1 text-sm text-[color:var(--muted)]">Optional notes only—no advanced statistics</p></Card>
      </SimpleGrid>

      <section className="mb-8">
        <SectionHeader eyebrow="Gym" title="Workout templates" description="Simple guidance for a balanced session; logging remains optional." action={<Button onClick={() => setShowTemplate((open) => !open)}>New template</Button>} />
        {showTemplate ? <Card className="mb-4"><form onSubmit={addTemplate} className="flex flex-col gap-3 sm:flex-row"><Input name="name" placeholder="Template name" required /><Button type="submit">Create template</Button></form></Card> : null}
        {state.workoutTemplates.length === 0 ? <EmptyState title="No workout template yet" description="Create one simple routine when guidance would help." /> : <div className="grid gap-4 xl:grid-cols-2">
          {state.workoutTemplates.map((template) => <Card key={template.id}>
            <CardHeader title={template.name} description="Choose an appropriate weight; perfect data is not required." />
            <div className="space-y-2">{template.exercises.map((exercise) => <div key={exercise.id} className="grid gap-1 rounded-lg bg-[color:var(--surface-muted)] p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div><p className="font-bold">{exercise.exercise}</p>{exercise.notes ? <p className="text-xs text-[color:var(--muted)]">{exercise.notes}</p> : null}</div>
              <p className="text-sm text-[color:var(--muted)]">{exercise.sets} × {exercise.reps}{exercise.weight ? ` · ${exercise.weight}` : ""}</p>
            </div>)}</div>
            <form onSubmit={(event) => addExercise(event, template.id)} className="mt-4 grid gap-2 sm:grid-cols-2">
              <Input name="exercise" placeholder="Exercise" required className="sm:col-span-2" /><Input name="sets" placeholder="Sets" required /><Input name="reps" placeholder="Reps" required /><Input name="weight" placeholder="Weight (optional)" /><Input name="notes" placeholder="Notes (optional)" /><div className="sm:col-span-2"><Button type="submit" variant="secondary">Add exercise</Button></div>
            </form>
          </Card>)}
        </div>}
      </section>

      <section>
        <SectionHeader eyebrow="Basketball" title="Session notes" description="Record the practice type and one short optional reflection." action={<Button onClick={() => setShowBasketball((open) => !open)}>Log session</Button>} />
        {showBasketball ? <Card className="mb-4"><form onSubmit={addBasketball} className="grid gap-4 md:grid-cols-2">
          <Field label="Date"><Input name="date" type="date" defaultValue={todayDate} /></Field><Field label="Session type"><Select name="type">{BASKETBALL_TYPES.map((type) => <option key={type} value={type}>{format(type)}</option>)}</Select></Field><Field label="Short note" className="md:col-span-2"><Textarea name="note" placeholder="Worked on left-hand finishes and pull-up jumpers." /></Field><div className="md:col-span-2"><Button type="submit">Save session</Button></div>
        </form></Card> : null}
        {state.basketballSessions.length === 0 ? <EmptyState title="No basketball sessions logged" description="Logging is optional. Enjoying and completing the session matters most." /> : <div className="grid gap-3 md:grid-cols-2">{state.basketballSessions.map((session) => <Card key={session.id}><div className="flex items-center justify-between"><h3 className="font-bold">{format(session.type)}</h3><Badge>{session.date}</Badge></div>{session.note ? <p className="mt-3 text-sm text-[color:var(--muted)]">{session.note}</p> : null}</Card>)}</div>}
      </section>
    </div>
  );
}
