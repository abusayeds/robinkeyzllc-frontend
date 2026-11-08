import {
  FiRepeat,
  FiUserPlus,
  FiUserMinus,
  FiGift,
} from "react-icons/fi";
import type {
  TransactionItem,
  TransactionType,
} from "@/lib/store/api/endpoints/transactionsApi";

const iconConfig: Record<
  TransactionType,
  { icon: React.ReactNode; tone: string }
> = {
  "Trade Accepted": {
    icon: <FiRepeat className="h-4 w-4" />,
    tone: "bg-brand-cta/15 text-brand-cta-dark",
  },
  "Draft Pick Traded": {
    icon: <FiGift className="h-4 w-4" />,
    tone: "bg-blue-100 text-blue-600",
  },
  "Player Signed": {
    icon: <FiUserPlus className="h-4 w-4" />,
    tone: "bg-brand-forest text-brand-accent",
  },
  "Free Agent Signed": {
    icon: <FiUserPlus className="h-4 w-4" />,
    tone: "bg-brand-cta/15 text-brand-cta-dark",
  },
  "Player Waived": {
    icon: <FiUserMinus className="h-4 w-4" />,
    tone: "bg-amber-100 text-amber-700",
  },
};

export default function TransactionRow({ item }: { item: TransactionItem }) {
  const config = iconConfig[item.type];

  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.tone}`}
      >
        {config.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="text-sm font-semibold text-brand-dark">
            {item.type}
          </span>
          {item.teams ? (
            <span className="text-sm text-brand-muted">— {item.teams}</span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-brand-muted">{item.description}</p>
      </div>

      <span className="shrink-0 whitespace-nowrap text-xs text-brand-muted">
        {item.date}
      </span>
    </div>
  );
}
