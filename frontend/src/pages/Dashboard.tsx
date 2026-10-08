import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { useI18n } from "../i18n/I18nContext";
import { api } from "../lib/api";
import type { Certification, InterviewAttempt, StudentProfile } from "../lib/types";
import { completenessScore, profileChecklist } from "../lib/profile";
import { Card } from "../components/ui/Card";
import { ProgressRing } from "../components/ui/ProgressRing";
import { Skeleton } from "../components/ui/Skeleton";
import { Badge } from "../components/ui/Badge";
import {
  ArrowRightIcon,
  AwardIcon,
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  FolderIcon,
  MicIcon,
  PlusIcon,
  SparklesIcon,
  type IconComponent,
} from "../components/icons";

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.morning" as const;
  if (hour < 18) return "dashboard.afternoon" as const;
  return "dashboard.evening" as const;
}

function daysUntil(date: string) {
  const ms = new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  to,
}: {
  label: string;
  value: ReactNode;
  sub: string;
  icon: IconComponent;
  tone: string;
  to: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:shadow-md">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">{label}</p>
          <div className={`hidden h-9 w-9 sm:flex items-center justify-center rounded-lg ${tone}`}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
      </Card>
    </Link>
  );
}

function scoreFrom(feedback: string | null) {
  const match = feedback ? /Score:\s*(\d+)\s*\/\s*10/i.exec(feedback) : null;
  return match ? Number(match[1]) : null;
}

export function Dashboard() {
  const { user } = useAuth();
  const { toast } = useUi();
  const { t, formatDate } = useI18n();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [attempts, setAttempts] = useState<InterviewAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ profile: StudentProfile | null }>("/profile/me").then((res) => setProfile(res.profile)),
      api.get<{ certifications: Certification[] }>("/certifications").then((res) => setCertifications(res.certifications)),
      api.get<{ attempts: InterviewAttempt[] }>("/interview/attempts").then((res) => setAttempts(res.attempts)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const checklist = profileChecklist(profile, certifications.length);
  const score = completenessScore(checklist);
  const projects = profile?.projects ?? [];
  const completedCerts = certifications.filter((c) => c.status === "COMPLETED").length;
  const upcoming = certifications
    .filter((c) => c.examDate && c.status !== "COMPLETED" && daysUntil(c.examDate) >= 0)
    .sort((a, b) => new Date(a.examDate!).getTime() - new Date(b.examDate!).getTime())
    .slice(0, 3);
  const scores = attempts.map((a) => scoreFrom(a.feedback)).filter((s): s is number => s !== null);
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  const portfolioUrl = profile ? `${window.location.origin}/p/${profile.slug}` : "";

  function copyLink() {
    void navigator.clipboard.writeText(portfolioUrl).then(() => toast(t("dashboard.linkCopied")));
  }

  const today = formatDate(new Date(), { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{today}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {t(greetingKey(), { name: user?.name.split(" ")[0] ?? "" })}
          </h1>
        </div>
        {profile && (
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <CopyIcon className="h-4 w-4" /> {t("dashboard.copyLink")}
            </button>
            <a
              href={`/p/${profile.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
            >
              {t("dashboard.viewPortfolio")} <ExternalLinkIcon className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label={t("dashboard.projects")}
            value={projects.length}
            sub={projects.length ? t("dashboard.projectsSome") : t("dashboard.projectsNone")}
            icon={FolderIcon}
            tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
            to="/projects"
          />
          <StatCard
            label={t("dashboard.certifications")}
            value={`${completedCerts}/${certifications.length}`}
            sub={t("dashboard.certificationsSub")}
            icon={AwardIcon}
            tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            to="/certifications"
          />
          <StatCard
            label={t("dashboard.practice")}
            value={attempts.length}
            sub={avgScore ? t("dashboard.practiceAverage", { score: avgScore }) : t("dashboard.practiceSub")}
            icon={MicIcon}
            tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            to="/interview"
          />
          <StatCard
            label={t("dashboard.skills")}
            value={profile?.skills.length ?? 0}
            sub={t("dashboard.skillsSub")}
            icon={SparklesIcon}
            tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
            to="/profile"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <ProgressRing value={loading ? 0 : score} size={112} stroke={10} />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t("dashboard.strengthTitle")}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {score === 100 ? t("dashboard.strengthDone") : t("dashboard.strengthTodo")}
              </p>
            </div>
          </div>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                    item.done
                      ? "border-transparent bg-slate-50 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500"
                      : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/5"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      item.done ? "bg-emerald-500 text-white" : "border-2 border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {item.done && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className={item.done ? "line-through" : ""}>{t(item.label)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-600/20">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">{t("dashboard.aiTitle")}</h2>
            <p className="mt-1 text-sm text-white/80">
              {t("dashboard.aiDescription")}
            </p>
            <div className="mt-4 flex-1 space-y-2">
              {[t("dashboard.aiPrompt1"), t("dashboard.aiPrompt2"), t("dashboard.aiPrompt3")].map((s) => (
                <Link
                  key={s}
                  to="/assistant"
                  className="block rounded-lg bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
                >
                  “{s}”
                </Link>
              ))}
            </div>
            <Link
              to="/assistant"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              {t("dashboard.startChat")} <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">{t("dashboard.upcomingExams")}</h2>
            <Link to="/certifications" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              {t("common.viewAll")}
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="mt-6 text-center">
              <CalendarIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("dashboard.noExams")}</p>
              <Link to="/certifications" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                <PlusIcon className="h-4 w-4" /> {t("dashboard.addCertification")}
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((c) => {
                const days = daysUntil(c.examDate!);
                return (
                  <li key={c.id} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                        {formatDate(c.examDate!, { month: "short" })}
                      </span>
                      <span className="text-sm font-bold leading-none text-slate-900 dark:text-white">
                        {new Date(c.examDate!).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{c.provider ?? t("dashboard.certificationFallback")}</p>
                    </div>
                    <Badge tone={days <= 7 ? "red" : days <= 30 ? "amber" : "slate"}>
                      {days === 0 ? t("common.today") : t("dashboard.daysShort", { days })}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">{t("dashboard.recentPractice")}</h2>
            <Link to="/interview" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              {t("dashboard.practiceNow")}
            </Link>
          </div>
          {attempts.length === 0 ? (
            <div className="mt-6 text-center">
              <MicIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t("dashboard.noPractice")}
              </p>
              <Link to="/interview" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                {t("dashboard.startPracticing")} <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {attempts.slice(0, 4).map((a) => {
                const s = scoreFrom(a.feedback);
                return (
                  <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{a.question.prompt}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {t(`interview.category.${a.question.category}`)} · {formatDate(a.createdAt)}
                      </p>
                    </div>
                    {s !== null && <Badge tone={s >= 8 ? "green" : s >= 5 ? "amber" : "red"}>{s}/10</Badge>}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
