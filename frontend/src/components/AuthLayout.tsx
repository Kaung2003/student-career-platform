import type { ReactNode } from "react";
import { Logo } from "./Logo";

const highlights = [
  "A shareable portfolio page with your projects and skills",
  "Track certifications from planning to completed",
  "Practice interview questions with instant AI feedback",
];

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2 dark:bg-slate-950">
      <aside className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative">
          <Logo inverted />
        </div>

        <div className="relative">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Build the portfolio that gets you hired.
          </h2>
          <ul className="mt-8 space-y-4">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-slate-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="mt-0.5 h-5 w-5 shrink-0 text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-slate-500">© {new Date().getFullYear()} Student Career Platform</p>
      </aside>

      <main className="flex flex-col px-4 py-8 sm:px-6">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
