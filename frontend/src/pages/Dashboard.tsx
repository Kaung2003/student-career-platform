import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Card } from "../components/ui/Card";
import { IconChip } from "../components/ui/IconChip";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Certification, StudentProfile } from "../lib/types";

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path strokeLinecap="round" d="M3 9h18" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.07 0l2-2a5 5 0 00-7.07-7.07l-1 1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 00-7.07 0l-2 2a5 5 0 007.07 7.07l1-1" />
    </svg>
  );
}

function CertificationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <circle cx="12" cy="9" r="5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5L7 21l5-2.5L17 21l-2-7.5" />
    </svg>
  );
}

function InterviewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      />
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h.01M8 16h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v13l4-3z" />
    </svg>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ profile: StudentProfile | null }>("/profile/me")
      .then((res) => setProfile(res.profile))
      .finally(() => setLoading(false));
    api
      .get<{ certifications: Certification[] }>("/certifications")
      .then((res) => setCertifications(res.certifications))
      .catch(() => {});
  }, []);

  const projectCount = profile?.projects?.length ?? 0;
  const certCount = certifications.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Welcome, {user?.name}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Here's an overview of your portfolio.</p>

        {!loading && !profile && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-6 dark:border-amber-500/20 dark:bg-amber-500/10">
            <h2 className="font-medium text-amber-900 dark:text-amber-200">Set up your profile</h2>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/80">
              You haven't created your student profile yet. Add a headline, bio, and skills to get your public
              portfolio page live.
            </p>
            <Link
              to="/profile"
              className="mt-3 inline-block rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              Create profile
            </Link>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link to="/profile">
            <Card className="h-full transition hover:shadow-md hover:-translate-y-0.5">
              <IconChip>
                <ProfileIcon />
              </IconChip>
              <h2 className="mt-4 font-medium text-slate-900 dark:text-slate-100">Profile</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {profile ? "Edit your headline, bio, and links" : "Not set up yet"}
              </p>
            </Card>
          </Link>

          <Link to="/projects">
            <Card className="h-full transition hover:shadow-md hover:-translate-y-0.5">
              <IconChip>
                <ProjectsIcon />
              </IconChip>
              <h2 className="mt-4 font-medium text-slate-900 dark:text-slate-100">Projects</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {projectCount} project{projectCount === 1 ? "" : "s"}
              </p>
            </Card>
          </Link>

          <Card className="h-full">
            <IconChip>
              <LinkIcon />
            </IconChip>
            <h2 className="mt-4 font-medium text-slate-900 dark:text-slate-100">Public portfolio</h2>
            {profile ? (
              <a
                href={`/p/${profile.slug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                /p/{profile.slug}
              </a>
            ) : (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Available after you create a profile</p>
            )}
          </Card>

          <Link to="/certifications">
            <Card className="h-full transition hover:shadow-md hover:-translate-y-0.5">
              <IconChip>
                <CertificationIcon />
              </IconChip>
              <h2 className="mt-4 font-medium text-slate-900 dark:text-slate-100">Certifications</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {certCount} tracked
              </p>
            </Card>
          </Link>

          <Link to="/interview">
            <Card className="h-full transition hover:shadow-md hover:-translate-y-0.5">
              <IconChip>
                <InterviewIcon />
              </IconChip>
              <h2 className="mt-4 font-medium text-slate-900 dark:text-slate-100">Interview practice</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Practice with AI feedback</p>
            </Card>
          </Link>

          <Link to="/feedback">
            <Card className="h-full transition hover:shadow-md hover:-translate-y-0.5">
              <IconChip>
                <FeedbackIcon />
              </IconChip>
              <h2 className="mt-4 font-medium text-slate-900 dark:text-slate-100">Feedback</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Report a bug or suggest a feature</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
