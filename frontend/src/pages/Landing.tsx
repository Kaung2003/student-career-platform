import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { IconChip } from "../components/ui/IconChip";
import { useAuth } from "../context/AuthContext";

const features: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: "Public portfolio",
    description: "Get a clean, shareable page with your bio, skills, projects, resume, and links — ready for any application.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.07 0l2-2a5 5 0 00-7.07-7.07l-1 1M14 11a5 5 0 00-7.07 0l-2 2a5 5 0 007.07 7.07l1-1" />,
  },
  {
    title: "Project showcase",
    description: "Document what you've built with tech stacks, screenshots, live demos, and GitHub links.",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path strokeLinecap="round" d="M3 9h18" />
      </>
    ),
  },
  {
    title: "Certification tracker",
    description: "Plan exams, track progress, and keep resources in one place from first study session to pass.",
    icon: (
      <>
        <circle cx="12" cy="9" r="5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5L7 21l5-2.5L17 21l-2-7.5" />
      </>
    ),
  },
  {
    title: "AI interview practice",
    description: "Answer behavioral, technical, and situational questions and get instant, specific feedback.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      />
    ),
  },
  {
    title: "Career assistant",
    description: "Ask the built-in assistant for help with your resume, project write-ups, or next steps.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />,
  },
  {
    title: "Student directory",
    description: "Discover classmates by school or skill, explore their work, and leave encouraging comments.",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
      </>
    ),
  },
];

const steps = [
  { title: "Create your account", description: "Sign up in seconds — your portfolio page is created automatically." },
  { title: "Add your work", description: "Fill in your profile, upload your resume, and add projects and certifications." },
  { title: "Share and practice", description: "Send your portfolio link to recruiters and sharpen your interview answers." },
];

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[28rem] max-w-4xl rounded-full bg-gradient-to-tr from-blue-200 via-indigo-100 to-sky-100 opacity-60 blur-3xl dark:from-blue-600/20 dark:via-indigo-500/10 dark:to-sky-500/10" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            Built for students and new graduates
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            Launch your career with a portfolio that <span className="text-blue-600 dark:text-blue-400">stands out</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Showcase your projects, track certifications, and practice interviews with AI feedback — all in one
            professional platform.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition hover:bg-blue-700 sm:w-auto"
              >
                Go to your dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition hover:bg-blue-700 sm:w-auto"
              >
                Get started — it's free
              </Link>
            )}
            <Link
              to="/directory"
              className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Browse student portfolios
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-20 dark:border-slate-900 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Features</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Everything you need to get job-ready
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              One place to present your work, prove your skills, and prepare for the conversation.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <IconChip>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    {feature.icon}
                  </svg>
                </IconChip>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              From sign-up to shareable in minutes
            </h2>
          </div>
          <ol className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="relative text-center md:text-left">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white md:mx-0">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-slate-900 px-6 py-16 text-center sm:px-12 dark:bg-slate-900 dark:ring-1 dark:ring-slate-800">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
          <h2 className="relative text-3xl font-semibold tracking-tight text-white">Ready to put your best work forward?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-slate-300">
            Join students building portfolios that recruiters actually read.
          </p>
          <Link
            to={user ? "/dashboard" : "/register"}
            className="relative mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            {user ? "Open dashboard" : "Create your free account"}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
