import { useEffect, useState, type ReactNode, type SubmitEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { useI18n } from "../i18n/I18nContext";
import { api, ApiError } from "../lib/api";
import type { StudentProfile } from "../lib/types";
import { SKILL_SUGGESTIONS } from "../lib/profile";
import { PageHeader } from "../components/PageHeader";
import { PROFILE_UPDATED_EVENT } from "../components/AppLayout";
import { AiImproveButton } from "../components/AiImproveButton";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Skeleton } from "../components/ui/Skeleton";
import { TagInput } from "../components/ui/TagInput";
import { FileUploadField } from "../components/ui/FileUploadField";
import { ExternalLinkIcon, GithubIcon, GlobeIcon, LinkedinIcon } from "../components/icons";

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <div className="mb-5">
        <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export function Profile() {
  const { user } = useAuth();
  const { toast } = useUi();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [transcriptUrl, setTranscriptUrl] = useState("");

  useEffect(() => {
    api
      .get<{ profile: StudentProfile | null }>("/profile/me")
      .then((res) => {
        const p = res.profile;
        if (!p) return;
        setSlug(p.slug);
        setHeadline(p.headline ?? "");
        setBio(p.bio ?? "");
        setSchool(p.school ?? "");
        setGradYear(p.gradYear?.toString() ?? "");
        setSkills(p.skills);
        setGithub(p.github ?? "");
        setLinkedin(p.linkedin ?? "");
        setWebsite(p.website ?? "");
        setResumeUrl(p.resumeUrl ?? "");
        setTranscriptUrl(p.transcriptUrl ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await api.put<{ profile: StudentProfile }>("/profile/me", {
        slug: slug.trim() || undefined,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        school: school.trim() || null,
        gradYear: gradYear.trim() ? Number(gradYear) : null,
        skills,
        github: github.trim() || null,
        linkedin: linkedin.trim() || null,
        website: website.trim() || null,
        resumeUrl: resumeUrl.trim() || null,
        transcriptUrl: transcriptUrl.trim() || null,
      });
      setSlug(res.profile.slug);
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
      toast(t("profile.saved"));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t("profile.saveFailed");
      setError(message);
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const aiContext = [school && `School: ${school}`, skills.length && `Skills: ${skills.join(", ")}`, headline && `Headline: ${headline}`]
    .filter(Boolean)
    .join(". ");

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title={t("profile.title")}
        description={t("profile.description")}
        actions={
          <>
            {slug && (
              <a
                href={`/p/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t("profile.preview")} <ExternalLinkIcon className="h-4 w-4" />
              </a>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("common.saveChanges")}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title={t("profile.aboutTitle")} description={t("profile.aboutDescription")}>
            <Field label={t("profile.headline")} action={<AiImproveButton kind="headline" text={headline} context={aiContext} onResult={setHeadline} />}>
              <input
                type="text"
                placeholder={t("profile.headlinePlaceholder")}
                value={headline}
                maxLength={120}
                onChange={(e) => setHeadline(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field
              label={t("profile.bio")}
              hint={t("profile.bioHint", { count: bio.length })}
              action={<AiImproveButton kind="bio" text={bio} context={aiContext} onResult={setBio} />}
            >
              <textarea
                rows={5}
                value={bio}
                placeholder={t("profile.bioPlaceholder")}
                onChange={(e) => setBio(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label={t("profile.skills")} hint={t("profile.skillsHint")}>
              <TagInput value={skills} onChange={setSkills} placeholder={t("profile.skillsPlaceholder")} suggestions={SKILL_SUGGESTIONS} />
            </Field>
          </Section>

          <Section title={t("profile.educationTitle")} description={t("profile.educationDescription")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Field label={t("profile.school")}>
                  <input
                    type="text"
                    placeholder={t("profile.schoolPlaceholder")}
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label={t("profile.gradYear")}>
                <input
                  type="number"
                  min={1950}
                  max={2100}
                  placeholder="2027"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Section title={t("profile.linksTitle")} description={t("profile.linksDescription")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="GitHub">
                <input type="text" inputMode="url" placeholder="https://github.com/you" value={github} onChange={(e) => setGithub(e.target.value)} className={inputClass} />
              </Field>
              <Field label="LinkedIn">
                <input
                  type="text" inputMode="url"
                  placeholder="https://linkedin.com/in/you"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label={t("profile.website")}>
              <input type="text" inputMode="url" placeholder="https://you.dev" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t("profile.portfolioUrl")} hint={t("profile.portfolioUrlHint")}>
              <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700">
                <span className="border-r border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                  {window.location.host}/p/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </Field>
          </Section>

          <Section title={t("profile.documentsTitle")} description={t("profile.documentsDescription")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("profile.resume")}>
                <FileUploadField
                  value={resumeUrl}
                  onChange={setResumeUrl}
                  uploadType="resume"
                  placeholder={t("profile.documentPlaceholder")}
                  accept="application/pdf"
                />
              </Field>
              <Field label={t("profile.transcript")}>
                <FileUploadField
                  value={transcriptUrl}
                  onChange={setTranscriptUrl}
                  uploadType="transcript"
                  placeholder={t("profile.documentPlaceholder")}
                  accept="application/pdf"
                />
              </Field>
            </div>
          </Section>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? t("common.saving") : t("common.saveChanges")}
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t("profile.livePreview")}</p>
          <Card padded={false} className="overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <div className="-mt-10 px-5 pb-5">
              <div className="rounded-full ring-4 ring-white dark:ring-slate-900 inline-block">
                <Avatar name={user?.name ?? "?"} size="lg" />
              </div>
              <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{headline || t("profile.headlineFallback")}</p>
              {(school || gradYear) && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {school}
                  {school && gradYear && " · "}
                  {gradYear && t("common.classOf", { year: gradYear })}
                </p>
              )}
              {bio && <p className="mt-3 line-clamp-4 text-sm text-slate-600 dark:text-slate-400">{bio}</p>}
              {skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {skills.slice(0, 8).map((s) => (
                    <Badge key={s} tone="blue">
                      {s}
                    </Badge>
                  ))}
                  {skills.length > 8 && <Badge>+{skills.length - 8}</Badge>}
                </div>
              )}
              <div className="mt-4 flex gap-2 text-slate-400">
                {github && <GithubIcon className="h-5 w-5" />}
                {linkedin && <LinkedinIcon className="h-5 w-5" />}
                {website && <GlobeIcon className="h-5 w-5" />}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
