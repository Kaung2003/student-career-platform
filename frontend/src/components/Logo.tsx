import { Link } from "react-router-dom";

export function Logo({ to = "/", onClick, inverted = false }: { to?: string; onClick?: () => void; inverted?: boolean }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 text-lg font-semibold tracking-tight ${
        inverted ? "text-white" : "text-slate-900 dark:text-slate-100"
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/30">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-[18px] w-[18px]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V9l8-5 8 5v10M9 19v-6h6v6" />
        </svg>
      </span>
      <span className="font-mono">
        career<span className={inverted ? "text-blue-400" : "text-blue-600 dark:text-blue-400"}>.</span>platform
      </span>
    </Link>
  );
}
