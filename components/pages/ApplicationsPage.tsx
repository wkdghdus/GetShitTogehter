"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useAppState } from "@/context/app-state-context";
import { createId } from "@/lib/defaults";
import { getWeekStart, parseLocalDate, getLocalDate } from "@/lib/dates";
import type { ApplicationStatus } from "@/lib/types";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, ProgressBar, SectionHeader, Select, Textarea } from "@/components/ui";

const STATUSES: Array<{ value: ApplicationStatus; label: string }> = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "oa", label: "OA" },
  { value: "recruiter-screen", label: "Recruiter Screen" },
  { value: "technical-interview", label: "Technical Interview" },
  { value: "final-interview", label: "Final Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

function weekEnd(weekStart: string) {
  const date = parseLocalDate(weekStart);
  date.setDate(date.getDate() + 6);
  return getLocalDate(date);
}

export function ApplicationsPage() {
  const { state, todayDate, isHydrated, setState } = useAppState();
  const [showForm, setShowForm] = useState(false);

  if (!isHydrated || !state) return <p className="text-[color:var(--muted)]">Loading applications…</p>;

  const weekStart = getWeekStart(todayDate);
  const end = weekEnd(weekStart);
  const appliedThisWeek = state.applications.filter(
    (application) => application.dateApplied && application.dateApplied >= weekStart && application.dateApplied <= end && application.status !== "saved",
  ).length;

  const addApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const company = String(data.get("company") ?? "").trim();
    const role = String(data.get("role") ?? "").trim();
    if (!company || !role) return;
    const optional = (name: string) => String(data.get(name) ?? "").trim() || undefined;
    setState((current) => ({
      ...current,
      applications: [
        {
          id: createId("application"),
          company,
          role,
          location: optional("location"),
          url: optional("url"),
          dateApplied: optional("dateApplied"),
          status: String(data.get("status") ?? "saved") as ApplicationStatus,
          referral: optional("referral"),
          notes: optional("notes"),
          nextAction: optional("nextAction"),
        },
        ...current.applications,
      ],
    }));
    form.reset();
    setShowForm(false);
  };

  const updateApplication = (id: string, patch: Record<string, string | undefined>) => {
    setState((current) => ({
      ...current,
      applications: current.applications.map((application) =>
        application.id === id ? { ...application, ...patch } : application,
      ),
    }));
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Career pipeline"
        title="Internship Applications"
        description="Aim for consistent, high-quality applications—not mass spam. Missing a weekly target is information, not a failure."
        action={<Button onClick={() => setShowForm((open) => !open)}>{showForm ? "Close form" : "Add application"}</Button>}
      />

      <Card className="mb-5" tone="quiet">
        <ProgressBar value={appliedThisWeek} max={state.settings.weeklyApplicationTarget} label="Applied this week" />
        <p className="mt-3 text-sm text-[color:var(--muted)]">Target range: {state.settings.weeklyApplicationTarget}–15 thoughtful applications.</p>
      </Card>

      {showForm ? (
        <Card className="mb-5">
          <CardHeader title="New application" description="Company and role are the only required fields." />
          <form onSubmit={addApplication} className="grid gap-4 md:grid-cols-2">
            <Field label="Company"><Input name="company" required /></Field>
            <Field label="Role"><Input name="role" required /></Field>
            <Field label="Location"><Input name="location" /></Field>
            <Field label="Job URL"><Input name="url" type="url" /></Field>
            <Field label="Date applied"><Input name="dateApplied" type="date" defaultValue={todayDate} /></Field>
            <Field label="Status">
              <Select name="status" defaultValue="applied">
                {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </Select>
            </Field>
            <Field label="Referral"><Input name="referral" /></Field>
            <Field label="Next action"><Input name="nextAction" placeholder="Prepare for OA" /></Field>
            <Field label="Notes" className="md:col-span-2"><Textarea name="notes" /></Field>
            <div className="md:col-span-2"><Button type="submit">Save application</Button></div>
          </form>
        </Card>
      ) : null}

      {state.applications.length === 0 ? (
        <EmptyState
          title="No applications recorded this week"
          description="Your goal is consistent, high-quality applications rather than mass applying."
          action={<Button onClick={() => setShowForm(true)}>Add the first one</Button>}
        />
      ) : (
        <div className="space-y-4">
          {state.applications.map((application) => (
            <Card key={application.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-[color:var(--text)]">{application.company}</h2>
                    <Badge>{STATUSES.find((status) => status.value === application.status)?.label ?? application.status}</Badge>
                  </div>
                  <p className="mt-1 font-medium">{application.role}{application.location ? ` · ${application.location}` : ""}</p>
                  {application.dateApplied ? <p className="mt-1 text-sm text-[color:var(--muted)]">Applied {application.dateApplied}</p> : null}
                </div>
                {application.url ? <a className="text-sm font-bold text-[color:var(--primary)] underline" href={application.url} target="_blank" rel="noreferrer">Job posting</a> : null}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Status">
                  <Select value={application.status} onChange={(event) => updateApplication(application.id, { status: event.target.value as ApplicationStatus })}>
                    {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </Select>
                </Field>
                <Field label="Next action">
                  <Input value={application.nextAction ?? ""} onChange={(event) => updateApplication(application.id, { nextAction: event.target.value || undefined })} placeholder="No next action yet" />
                </Field>
              </div>
              {application.notes ? <p className="mt-4 rounded-lg bg-[color:var(--surface-muted)] p-3 text-sm">{application.notes}</p> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
