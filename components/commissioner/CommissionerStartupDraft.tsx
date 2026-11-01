"use client";

import React, { useState } from "react";
import { LuGripVertical } from "react-icons/lu";

interface DraftOrderItem {
  id: string;
  num: number;
  team: string;
  teamCode: string;
}

interface StartupProspect {
  id: string;
  name: string;
  position: string;
  age: number;
  team: string;
  contract: string;
}

const MOCK_DRAFT_ORDER: DraftOrderItem[] = [
  { id: "1", num: 1, team: "Boston Celtics", teamCode: "BOS" },
  { id: "2", num: 2, team: "New York Knicks", teamCode: "NYK" },
  { id: "3", num: 3, team: "Miami Heat", teamCode: "MIA" },
  { id: "4", num: 4, team: "Chicago Bulls", teamCode: "CHI" },
  { id: "5", num: 5, team: "Utah Jazz", teamCode: "UTA" },
  { id: "6", num: 6, team: "L.A. Lakers", teamCode: "LAL" },
  { id: "7", num: 7, team: "Golden State Warriors", teamCode: "GSW" },
  { id: "8", num: 8, team: "Dallas Mavericks", teamCode: "DAL" },
];

const MOCK_PROSPECTS: StartupProspect[] = [
  { id: "1", name: "Jayson Tatum", position: "SF", age: 28, team: "BOS", contract: "$55,000,000" },
  { id: "2", name: "Luka Doncic", position: "PG", age: 26, team: "DAL", contract: "$43,000,000" },
  { id: "3", name: "Nikola Jokic", position: "C", age: 30, team: "DEN", contract: "$55,200,000" },
  { id: "4", name: "Devin Booker", position: "SG", age: 28, team: "PHX", contract: "$49,200,000" },
  { id: "5", name: "Anthony Davis", position: "PF", age: 31, team: "LAL", contract: "$43,200,000" },
  { id: "6", name: "Jalen Brunson", position: "PG", age: 28, team: "NYK", contract: "$24,900,000" },
  { id: "7", name: "Bam Adebayo", position: "C", age: 27, team: "MIA", contract: "$34,800,000" },
  { id: "8", name: "Zach LaVine", position: "SG", age: 30, team: "CHI", contract: "$43,000,000" },
  { id: "9", name: "Lauri Markkanen", position: "PF", age: 28, team: "UTA", contract: "$17,300,000" },
];

export default function CommissionerStartupDraft() {
  const [draftOrder, setDraftOrder] = useState<DraftOrderItem[]>(MOCK_DRAFT_ORDER);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProspects = MOCK_PROSPECTS.filter((prospect) =>
    prospect.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Startup Draft Settings</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Configure draft format, pick times, and team order for the league startup draft.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      {/* Main Content */}
      <div className="space-y-6">
      <div className="rounded-xl border border-brand-border bg-white shadow-sm">
        {/* Draft Format Header */}
        <div className="border-b border-brand-border px-6 py-4">
          <h2 className="text-base font-bold text-brand-dark">Draft Format</h2>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 border-b border-brand-border p-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Number of Rounds */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                Number of Rounds
              </label>
              <p className="mb-2 text-xs text-brand-muted">
                Total rounds in the startup draft
              </p>
              <input
                type="number"
                defaultValue="15"
                className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
              />
            </div>

            {/* Draft Start Date */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                Draft Start Date
              </label>
              <p className="mb-2 text-xs text-brand-muted">When the draft begins</p>
              <input
                type="text"
                defaultValue="Aug 25, 2026"
                placeholder="Aug 25, 2026"
                className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  defaultValue="7:00 PM"
                  placeholder="7:00 PM"
                  className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                />
                <input
                  type="text"
                  defaultValue="EST (UTC-5)"
                  placeholder="EST (UTC-5)"
                  className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                />
              </div>
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
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Snake Order */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                Snake Order
              </label>
              <p className="mb-2 text-xs text-brand-muted">
                Reverse draft order after each round
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
                <span className="text-sm font-semibold text-brand-dark">3</span>
              </label>
            </div>

            {/* Reversal Round */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                Reversal Round
              </label>
              <p className="mb-2 text-xs text-brand-muted">
                Enable to select a round where other reversal begins
              </p>
              <input
                type="number"
                defaultValue="3"
                className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
              />
            </div>

            {/* Auto Set Draft Order */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                Auto Set Draft Order
              </label>
              <p className="mb-2 text-xs text-brand-muted">
                Auto randomize draft order, then make draft for remaining rounds
              </p>
              <label className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-gray-300 transition checked:bg-emerald-500"
                  />
                  <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:left-[1.125rem]" />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Draft Order Section */}
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-dark">Draft Order</h2>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
            >
              <span>⚲</span>
              <span>Randomize</span>
            </button>
          </div>

          <div className="space-y-0">
            {draftOrder.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 px-4 py-4 transition hover:bg-brand-soft/50 ${
                  index !== draftOrder.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <button
                  type="button"
                  className="cursor-grab text-brand-muted hover:text-brand-dark active:cursor-grabbing"
                >
                  <LuGripVertical className="h-5 w-5" />
                </button>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-sm font-bold text-brand-dark">
                  {item.num}
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded bg-orange-500 text-xs font-bold text-white">
                  {item.teamCode.substring(0, 2)}
                </div>
                <span className="flex-1 font-medium text-brand-dark">{item.team}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Right Column - Startup Player Pool */}
      <div className="space-y-6">
        <div className="rounded-xl border border-brand-border bg-white shadow-sm">
          <div className="border-b border-brand-border px-6 py-4">
            <h2 className="text-base font-bold text-brand-dark">Startup Player Pool</h2>
            <p className="mt-1 text-xs text-brand-muted">
              The startup draft will use the imported player pool. Player
              contracts are pulled in automatically (demo contracts shown
              here).
            </p>
          </div>

          <div className="p-6">
            <div className="mb-4 rounded-lg bg-emerald-50 p-4">
              <h3 className="mb-3 text-sm font-bold text-emerald-900">
                Player Contracts Imported
              </h3>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-emerald-700">Available Players</p>
                  <p className="text-lg font-bold text-emerald-900">
                    {MOCK_PROSPECTS.length}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-700">Drafted</p>
                  <p className="text-lg font-bold text-emerald-900">0</p>
                </div>
                <div>
                  <p className="text-emerald-700">Contract Source</p>
                  <p className="text-sm font-bold text-emerald-900">Demo API</p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand-dark">Player Preview</h3>
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
                            <span className="font-medium text-brand-dark">
                              {prospect.name}
                            </span>
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

              <p className="mt-2 text-xs text-brand-muted">
                Showing {filteredProspects.length} of {MOCK_PROSPECTS.length} players
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
