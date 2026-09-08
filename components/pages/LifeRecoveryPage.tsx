"use client";

import { useAppState } from "@/context/app-state-context";
import { Card, CardHeader, CheckboxRow, SectionHeader, SimpleGrid } from "@/components/ui";

const CHECK_INS = [
  { key: "family", title: "Family", description: "Shared time, a meal, or a conversation." },
  { key: "girlfriend", title: "Girlfriend", description: "Connection without multitasking." },
  { key: "friends", title: "Friends", description: "A message, call, coffee, or time together." },
  { key: "outside-coffee", title: "Outside / Coffee", description: "Fresh air, a walk, or a change of scene." },
  { key: "free-time", title: "Free Time", description: "Games, videos, reading, entertainment, or nothing." },
  { key: "rest", title: "Rest", description: "Intentional pause, easy time, or extra sleep." },
];

export function LifeRecoveryPage() {
  const { today, isHydrated, updateToday } = useAppState();
  if (!isHydrated || !today) return <p className="text-[color:var(--muted)]">Loading life and recovery…</p>;
  const toggle = (key: string, checked: boolean) => updateToday((entry) => ({ ...entry, lifeCheckIns: checked ? Array.from(new Set([...entry.lifeCheckIns, key])) : entry.lifeCheckIns.filter((item) => item !== key) }));
  return <div>
    <SectionHeader eyebrow="A sustainable life" title="Life & Recovery" description="Relationships, outside time, enjoyment, and rest are legitimate parts of the routine—not rewards for exhausting yourself." />
    <Card tone="quiet" className="mb-6"><CardHeader title="Awareness, not another checklist" description="These optional check-ins can help you notice balance. Leave all of them empty when tracking would create pressure." /><p className="text-sm text-[color:var(--muted)]">They prevent burnout and make consistent career, school, and physical progress possible.</p></Card>
    <SimpleGrid className="xl:grid-cols-2">{CHECK_INS.map((item) => <Card key={item.key}><CheckboxRow label={item.title} description={item.description} checked={today.lifeCheckIns.includes(item.key)} onChange={(event) => toggle(item.key, event.target.checked)} /><p className="mt-3 text-xs text-[color:var(--muted)]">Optional check-in for today</p></Card>)}</SimpleGrid>
    <Card className="mt-6" tone="success"><h2 className="text-xl font-bold">Free life belongs in the plan.</h2><p className="mt-2 text-sm text-[color:var(--muted)]">The planned focus block being complete is enough. Family, friends, coffee, a movie, gaming, a walk, or doing nothing do not need extra justification.</p></Card>
  </div>;
}
