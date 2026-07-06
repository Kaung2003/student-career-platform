import { useEffect, useState, type SubmitEvent } from "react";
import { Navbar } from "../components/Navbar";
import { api, ApiError } from "../lib/api";
import type { CertStatus, Certification } from "../lib/types";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";

const STATUS_LABEL: Record<CertStatus, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

const emptyForm = {
  name: "",
  provider: "",
  examDate: "",
  status: "PLANNING" as CertStatus,
  notes: "",
  resourceUrl: "",
};

export function Certifications() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  function load() {
    return api
      .get<{ certifications: Certification[] }>("/certifications")
      .then((res) => setCertifications(res.certifications));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  function startEdit(cert: Certification) {
    setEditingId(cert.id);
    setForm({
      name: cert.name,
      provider: cert.provider ?? "",
      examDate: cert.examDate ? cert.examDate.slice(0, 10) : "",
      status: cert.status,
      notes: cert.notes ?? "",
      resourceUrl: cert.resourceUrl ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      provider: form.provider.trim() || null,
      examDate: form.examDate || null,
      status: form.status,
      notes: form.notes.trim() || null,
      resourceUrl: form.resourceUrl.trim() || null,
    };

    try {
      if (editingId) {
        await api.put(`/certifications/${editingId}`, payload);
      } else {
        await api.post("/certifications", payload);
      }
      await load();
      cancelEdit();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save certification");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this certification?")) return;
    await api.delete(`/certifications/${id}`);
    await load();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Certifications</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Track exams you're studying for or have completed.</p>

        <Card className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-medium text-slate-900 dark:text-slate-100">
              {editingId ? "Edit certification" : "Add a certification"}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  type="text"
                  required
                  placeholder="AWS Certified Cloud Practitioner"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Provider">
                <input
                  type="text"
                  placeholder="Amazon Web Services"
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Exam date">
                <input
                  type="date"
                  value={form.examDate}
                  onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as CertStatus })}
                  className={inputClass}
                >
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Resource URL">
              <input
                type="text"
                placeholder="Link to study guide, exam page, etc."
                value={form.resourceUrl}
                onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Notes">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={inputClass}
              />
            </Field>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update certification" : "Add certification"}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <div className="mt-8 space-y-4">
          {loading && <p className="text-slate-500 dark:text-slate-400">Loading...</p>}
          {!loading && certifications.length === 0 && (
            <EmptyState title="No certifications yet" description="Add one above to start tracking your progress." />
          )}

          {certifications.map((cert) => (
            <Card key={cert.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">{cert.name}</h3>
                  {cert.provider && <p className="text-sm text-slate-500 dark:text-slate-400">{cert.provider}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <Badge>{STATUS_LABEL[cert.status]}</Badge>
                  <button
                    onClick={() => startEdit(cert)}
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cert.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {cert.examDate && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Exam date: {new Date(cert.examDate).toLocaleDateString()}
                </p>
              )}
              {cert.notes && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{cert.notes}</p>}
              {cert.resourceUrl && (
                <a
                  href={cert.resourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Study resource
                </a>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
