"use client";

import type { Team } from "@/lib/store/api/endpoints/teamApi";

export default function TeamSelector({
  teams,
  value,
  onChange,
  myTeamId,
}: {
  teams: Team[];
  value: number | null;
  onChange: (teamId: number) => void;
  myTeamId: number | null;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
    >
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}
          {team.id === myTeamId ? " (your team)" : ""}
        </option>
      ))}
    </select>
  );
}
