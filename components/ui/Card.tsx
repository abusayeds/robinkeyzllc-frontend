import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-brand-border bg-white p-5 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  href,
  action = "View All",
}: {
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-brand-dark">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-medium text-brand-cta hover:text-brand-cta-dark"
        >
          {action} <FiArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
