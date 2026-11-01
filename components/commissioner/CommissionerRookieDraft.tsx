"use client";

import React, { useState } from "react";
import { LuGripVertical } from "react-icons/lu";

interface DraftOrderItem {
  id: string;
  num: number;
  team: string;
  teamCode: string;
  owner: string;
  pick: string;
}

interface RookieProspect {
  id: string;
  name: string;
  position: string;
  age: number;
  team: string;
  contract: string;
}

const MOCK_DRAFT_ORDER: DraftOrderItem[] = [
  { id: "1", num: 1, team: "Boston Celtics", teamCode: "BOS", owner: "Team Owner", pick: "1" },
  { id: "2", num: 2, team: "New York Knicks", teamCode: "NYK", owner: "Team Owner", pick: "2" },
  { id: "3", num: 3, team: "Miami Heat", teamCode: "MIA", owner: "Team Owner", pick: "3" },
  { id: "4", num: 4, team: "Chicago Bulls", teamCode: "CHI", owner: "Team Owner", pick: "4" },
  { id: "5", num: 5, team: "Utah Jazz", teamCode: "UTA", owner: "Team Owner", pick: "5" },
  { id: "6", num: 6, team: "L.A. Lakers", teamCode: "LAL", owner: "Team Owner", pick: "6" },
  { id: "7", num: 7, team: "Golden State Warriors", teamCode: "GSW", owner: "Team Owner", pick: "7" },
  { id: "8", num: 8, team: "Dallas Mavericks", teamCode: "DAL", owner: "Team Owner", pick: "8" },
  { id: "9", num: 9, team: "Phoenix Suns", teamCode: "PHX", owner: "Team Owner", pick: "9" },
  { id: "10", num: 10, team: "Denver Nuggets", teamCode: "DEN", owner: "Team Owner", pick: "10" },
];

const MOCK_PROSPECTS: RookieProspect[] = [
  { id: "1", name: "Cooper Flagg", position: "F", age: 18, team: "BRK", contract: "Not Assigned" },
  { id: "2", name: "Dylan Harper", position: "G", age: 19, team: "ORL", contract: "Not Assigned" },
  { id: "3", name: "Ace Bailey", position: "F", age: 19, team: "PHI", contract: "Not Assigned" },
  { id: "4", name: "V.J. Edgecombe", position: "G", age: 19, team: "NYK", contract: "Not Assigned" },
  { id: "5", name: "Khaman Maluach", position: "C", age: 18, team: "CHA", contract: "Not Assigned" },
  { id: "6", name: "Tre Johnson", position: "G", age: 19, team: "WAS", contract: "Not Assigned" },
  { id: "7", name: "Asa Newell", position: "F", age: 18, team: "IND", contract: "Not Assigned" },
  { id: "8", name: "Aca Peist", position: "F", age: 18, team: "NOP", contract: "Not Assigned" },
  { id: "9", name: "Jeremiah Fears", position: "G", age: 18, team: "NOP", contract: "Not Assigned" },
];

export default function CommissionerRookieDraft() {
  const [currentRound, setCurrentRound] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProspects = MOCK_PROSPECTS.filter((prospect) =>
    prospect.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Rookie Draft Settings</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Configure your rookie draft format, pick times, and team order for the league rookie draft.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left Column - Main Settings */}
        <div className="space-y-6">
          {/* Draft Format */}
          <div className="rounded-xl border border-brand-border bg-white shadow-sm">
            <div className="border-b border-brand-border px-6 py-4">
              <h2 className="text-base font-bold text-brand-dark">Draft Format</h2>
            </div>

            <div className="space-y-5 p-6">
              {/* Number of Rounds */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                  Number of Rounds
                </label>
                <p className="mb-2 text-xs text-brand-muted">
                  Total rounds in the rookie draft
                </p>
                <input
                  type="number"
                  defaultValue="2"
                  className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                />
                <p className="mt-1 text-xs italic text-brand-muted">
                  Rookie Draft is fixed at 2 rounds.
                </p>
              </div>

              {/* Draft Start */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                  Draft Start
                </label>
                <p className="mb-2 text-xs text-brand-muted">When the draft begins</p>
                <input
                  type="text"
                  defaultValue="Sep 5, 2026"
                  className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                />
                <input
                  type="text"
                  defaultValue="8:00 PM EST"
                  className="mt-2 w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                />
              </div>

              {/* Pick Timer */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                  Pick Timer
                </label>
                <p className="mb-2 text-xs text-brand-muted">Time allowed per pick</p>
                <input
                  type="text"
                  defaultValue="8 hours"
                  className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                />
              </div>

              {/* Snake Order */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                  Snake Order
                </label>
                <p className="mb-2 text-xs text-brand-muted">
                  Reverses draft order after each round
                </p>
                <label className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-gray-300 transition checked:bg-emerald-500"
                    />
                    <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:left-[1.125rem]" />
                  </div>
                </label>
              </div>

              {/* Reversal Round */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                  Reversal Round
                </label>
                <p className="mb-2 text-xs text-brand-muted">
                  Not available for rookie drafts
                </p>
                <div className="rounded-lg border border-brand-border bg-gray-50 px-3 py-2.5 text-sm text-brand-muted">
                  N/A
                </div>
              </div>
            </div>
          </div>

          {/* Draft Order */}
          <div className="rounded-xl border border-brand-border bg-white shadow-sm">
            <div className="border-b border-brand-border px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-brand-dark">Draft Order</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentRound(1)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      currentRound === 1
                        ? "bg-brand-dark text-white"
                        : "bg-gray-100 text-brand-muted hover:bg-gray-200"
                    }`}
                  >
                    Round 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentRound(2)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      currentRound === 2
                        ? "bg-brand-dark text-white"
                        : "bg-gray-100 text-brand-muted hover:bg-gray-200"
                    }`}
                  >
                    Round 2
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="mb-4 text-xs text-brand-muted">
                Draft order followed by draft pick ownership. You can reorder the picks if needed.
              </p>

              {/* Draft Order Table */}
              <div className="overflow-hidden rounded-lg border border-brand-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-brand-border bg-gray-50 text-[11px] font-semibold uppercase text-brand-muted">
                      <th className="px-3 py-2.5 text-left">#</th>
                      <th className="px-3 py-2.5 text-left">Team</th>
                      <th className="px-3 py-2.5 text-left">Owner</th>
                      <th className="px-3 py-2.5 text-left">Pick</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border bg-white">
                    {MOCK_DRAFT_ORDER.map((item) => (
                      <tr key={item.id} className="group hover:bg-brand-soft/30">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="cursor-grab text-brand-muted hover:text-brand-dark"
                            >
                              <LuGripVertical className="h-4 w-4" />
                            </button>
                            <span className="font-semibold text-brand-dark">{item.num}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500 text-[10px] font-bold text-white">
                              {item.teamCode.substring(0, 2)}
                            </div>
                            <span className="font-medium text-brand-dark">{item.team}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-brand-muted">{item.owner}</td>
                        <td className="px-3 py-3 text-brand-dark">{item.pick}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-xs text-brand-muted">Showing 1 to 10 of 30 teams</p>

              {/* Pagination */}
              <div className="mt-3 flex items-center justify-center gap-1">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded bg-brand-dark text-xs font-semibold text-white"
                >
                  1
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft"
                >
                  2
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft"
                >
                  3
                </button>
                <span className="px-2 text-xs text-brand-muted">...</span>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft"
                >
                  30
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Rookie Player Pool */}
        <div className="space-y-6">
          <div className="rounded-xl border border-brand-border bg-white shadow-sm">
            <div className="border-b border-brand-border px-6 py-4">
              <h2 className="text-base font-bold text-brand-dark">Rookie Player Pool</h2>
              <p className="mt-1 text-xs text-brand-muted">
                The rookie draft will use the incoming rookie class. Players will enter the draft
                without active contract information.
              </p>
            </div>

            <div className="p-6">
              {/* 2027 Rookie Class Loaded */}
              <div className="mb-4 rounded-lg bg-emerald-50 p-4">
                <h3 className="mb-3 text-sm font-bold text-emerald-900">
                  2027 Rookie Class Loaded
                </h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-emerald-700">Available Prospects</p>
                    <p className="text-lg font-bold text-emerald-900">74</p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Undrafted/Other</p>
                    <p className="text-lg font-bold text-emerald-900">16</p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Contract Class</p>
                    <p className="text-sm font-bold text-emerald-900">≈ Not applied</p>
                  </div>
                </div>
              </div>

              {/* Rookie Class Preview */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-brand-dark">Rookie Class Preview</h3>
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-32 rounded border border-brand-border px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-brand-cta/30"
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-brand-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-brand-border bg-gray-50 text-[10px] font-semibold uppercase text-brand-muted">
                        <th className="px-2 py-2 text-left">Player</th>
                        <th className="px-2 py-2 text-center">Pos</th>
                        <th className="px-2 py-2 text-center">Age</th>
                        <th className="px-2 py-2 text-center">Team</th>
                        <th className="px-2 py-2 text-right">Contract</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border bg-white">
                      {filteredProspects.map((prospect) => (
                        <tr key={prospect.id} className="hover:bg-brand-soft/30">
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-forest text-[10px] font-bold text-brand-accent">
                                {prospect.name.charAt(0)}
                              </div>
                              <span className="font-medium text-brand-dark">{prospect.name}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-brand-muted">
                            {prospect.position}
                          </td>
                          <td className="px-2 py-2 text-center text-brand-muted">
                            {prospect.age}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className="inline-flex h-5 items-center justify-center rounded bg-blue-100 px-1.5 text-[10px] font-bold text-blue-700">
                              {prospect.team}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-right text-brand-muted">
                            {prospect.contract}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-2 text-xs text-brand-muted">Showing 9 of 74 prospects</p>

                {/* Pagination */}
                <div className="mt-3 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded bg-brand-dark text-xs font-semibold text-white"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft"
                  >
                    2
                  </button>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft"
                  >
                    3
                  </button>
                  <span className="px-1 text-xs text-brand-muted">...</span>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
