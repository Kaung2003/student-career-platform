import { useEffect, useState, type SubmitEvent } from "react";
import { Navbar } from "../components/Navbar";
import { api, ApiError } from "../lib/api";
import type { StudentProfile } from "../lib/types";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { FileUploadField } from "../components/ui/FileUploadField";

export function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [skills, setSkills] = useState("");
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
        setSkills(p.skills.join(", "));
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
    setSuccess(false);
    setSaving(true);

    try {
      const res = await api.put<{ profile: StudentProfile }>("/profile/me", {
        slug: slug.trim() || undefined,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        school: school.trim() || null,
        gradYear: gradYear.trim() ? Number(gradYear) : null,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        github: github.trim() || null,
        linkedin: linkedin.trim() || null,
        website: website.trim() || null,
        resumeUrl: resumeUrl.trim() || null,
        transcriptUrl: transcriptUrl.trim() || null,
      });
      setSlug(res.profile.slug);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <p className="p-10 text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Your profile</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          This information appears on your public portfolio page.
        </p>

        <Card className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Portfolio URL">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>/p/</span>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
              </div>
            </Field>

            <Field label="Headline">
              <input
                type="text"
                placeholder="e.g. Computer Science Student @ ABC University"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Bio">
              <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass} />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="School">
                <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Graduation year">
                <input
                  type="number"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Skills (comma-separated)">
              <input
                type="text"
                placeholder="React, TypeScript, PostgreSQL"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="GitHub URL">
                <input
                  type="text"
                  placeholder="https://github.com/you"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="LinkedIn URL">
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/you"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Website">
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Resume">
                <FileUploadField
                  value={resumeUrl}
                  onChange={setResumeUrl}
                  uploadType="resume"
                  placeholder="Paste a URL or upload a PDF"
                  accept="application/pdf"
                />
              </Field>
              <Field label="Transcript">
                <FileUploadField
                  value={transcriptUrl}
                  onChange={setTranscriptUrl}
                  uploadType="transcript"
                  placeholder="Paste a URL or upload a PDF"
                  accept="application/pdf"
                />
              </Field>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-600 dark:text-green-400">Profile saved.</p>}

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
