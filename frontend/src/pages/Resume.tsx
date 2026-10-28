import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import { api } from "../lib/api";
import type { Certification, StudentProfile } from "../lib/types";
import { Button, buttonClass } from "../components/ui/Button";
import { ArrowLeftIcon, FileTextIcon } from "../components/icons";

function cleanUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function Heading({ children }: { children: string }) {
  return (
    <h2 className="mb-2 border-b border-slate-300 pb-1 text-[11pt] font-bold uppercase tracking-[0.12em] text-slate-800">{children}</h2>
  );
}

/** A clean, one-page resume built from the profile. "Download PDF" uses the browser's print-to-PDF. */
export function Resume() {
  const { user } = useAuth();
  const { t, formatDate } = useI18n();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ profile: StudentProfile | null }>("/profile/me").then((r) => setProfile(r.profile)),
      api.get<{ certifications: Certification[] }>("/certifications").then((r) => setCertifications(r.certifications)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = `${user?.name ?? "Resume"} — ${t("resume.title")}`;
    return () => {
      document.title = previous;
    };
  }, [user?.name, t]);

  const completed = certifications.filter((c) => c.status === "COMPLETED");
  const projects = profile?.projects ?? [];
  const links = [user?.email, profile?.website, profile?.linkedin, profile?.github].filter(Boolean) as string[];
  const isEmpty = !profile?.headline && !profile?.bio && !profile?.skills.length && projects.length === 0;

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0 dark:bg-slate-950">
      <div className="mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <Link to="/profile" className={buttonClass("ghost")}>
          <ArrowLeftIcon className="h-4 w-4" /> {t("resume.back")}
        </Link>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">{t("resume.tip")}</p>
          <Button onClick={() => window.print()} disabled={loading}>
            <FileTextIcon className="h-4 w-4" /> {t("resume.download")}
          </Button>
        </div>
      </div>

      <article className="mx-auto min-h-[297mm] max-w-[210mm] bg-white px-[16mm] py-[14mm] font-serif text-[10.5pt] leading-snug text-slate-900 shadow-xl print:min-h-0 print:shadow-none">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          </div>
        ) : (
          <>
            <header className="mb-5 text-center">
              <h1 className="text-[22pt] font-bold tracking-tight">{user?.name}</h1>
              {profile?.headline && <p className="mt-1 text-[11.5pt] text-slate-700">{profile.headline}</p>}
              {links.length > 0 && (
                <p className="mt-2 text-[9.5pt] text-slate-600">{links.map((l) => (l.includes("@") ? l : cleanUrl(l))).join("  ·  ")}</p>
              )}
            </header>

            {isEmpty && (
              <div className="rounded border border-dashed border-slate-300 p-6 text-center font-sans text-sm text-slate-500 print:hidden">
                <p>{t("resume.empty")}</p>
                <Link to="/profile" className={`${buttonClass("primary", "sm")} mt-4`}>
                  {t("resume.editProfile")}
                </Link>
              </div>
            )}

            {profile?.bio && (
              <section className="mb-4">
                <Heading>{t("resume.summary")}</Heading>
                <p className="whitespace-pre-line">{profile.bio}</p>
              </section>
            )}

            {(profile?.school || profile?.gradYear) && (
              <section className="mb-4">
                <Heading>{t("resume.education")}</Heading>
                <div className="flex justify-between gap-4">
                  <p className="font-semibold">{profile?.school}</p>
                  {profile?.gradYear && <p className="text-slate-600">{t("common.classOf", { year: profile.gradYear })}</p>}
                </div>
              </section>
            )}

            {profile && profile.skills.length > 0 && (
              <section className="mb-4">
                <Heading>{t("resume.skills")}</Heading>
                <p>{profile.skills.join("  •  ")}</p>
              </section>
            )}

            {projects.length > 0 && (
              <section className="mb-4">
                <Heading>{t("resume.projects")}</Heading>
                <div className="space-y-3">
                  {projects.map((p) => (
                    <div key={p.id} className="break-inside-avoid">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <p className="font-semibold">{p.title}</p>
                        {(p.projectUrl || p.githubUrl) && (
                          <p className="text-[9pt] text-slate-600">{cleanUrl((p.projectUrl ?? p.githubUrl)!)}</p>
                        )}
                      </div>
                      {p.techStack.length > 0 && <p className="text-[9.5pt] italic text-slate-600">{p.techStack.join(", ")}</p>}
                      {p.description && <p className="mt-0.5">{p.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section className="mb-4">
                <Heading>{t("resume.certifications")}</Heading>
                <ul className="space-y-1">
                  {completed.map((c) => (
                    <li key={c.id} className="flex justify-between gap-4">
                      <span>
                        <span className="font-semibold">{c.name}</span>
                        {c.provider && <span className="text-slate-600"> — {c.provider}</span>}
                      </span>
                      {c.examDate && <span className="text-slate-600">{formatDate(c.examDate, { month: "short", year: "numeric" })}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </article>
    </div>
  );
}
