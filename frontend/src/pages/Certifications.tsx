import { useEffect, useState, type SubmitEvent } from "react";
import { useUi } from "../context/UiContext";
import { api, ApiError } from "../lib/api";
import type { CertStatus, Certification } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Badge, type BadgeTone } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { AwardIcon, CalendarIcon, ExternalLinkIcon, PencilIcon, PlusIcon, TrashIcon } from "../components/icons";

const STATUS: Record<CertStatus, { label: string; tone: BadgeTone; bar: string }> = {
  PLANNING: { label: "Planning", tone: "slate", bar: "bg-slate-300 dark:bg-slate-600" },
  IN_PROGRESS: { label: "In progress", tone: "amber", bar: "bg-amber-500" },
  COMPLETED: { label: "Completed", tone: "green", bar: "bg-emerald-500" },
};

const STATUSES = Object.keys(STATUS) as CertStatus[];

const emptyForm = {
  name: "",
  provider: "",
  examDate: "",
  status: "PLANNING" as CertStatus,
  notes: "",
  resourceUrl: "",
};

function examLabel(date: string, status: CertStatus) {
  const days = Math.round((new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  const formatted = new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  if (status === "COMPLETED") return { text: `Passed ${formatted}`, urgent: false };
  if (days < 0) return { text: `${formatted} · ${Math.abs(days)}d ago`, urgent: false };
  if (days === 0) return { text: `${formatted} · Today!`, urgent: true };
  return { text: `${formatted} · in ${days} day${days === 1 ? "" : "s"}`, urgent: days <= 7 };
}

export function Certifications() {
  const { toast, confirm } = useUi();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<CertStatus | "ALL">("ALL");

  function load() {
    return api.get<{ certifications: Certification[] }>("/certifications").then((res) => setCertifications(res.certifications));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(cert: Certification) {
    setEditingId(cert.id);
    setForm({
      name: cert.name,
      provider: cert.provider ?? "",
      examDate: cert.examDate ? cert.examDate.slice(0, 10) : "",
      status: cert.status,
      notes: cert.notes ?? "",
      resourceUrl: cert.resourceUrl ?? "",
    });
    setError(null);
    setModalOpen(true);
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
      setModalOpen(false);
      toast(editingId ? "Certification updated" : "Certification added");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save certification");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(cert: Certification, status: CertStatus) {
    try {
      await api.put(`/certifications/${cert.id}`, {
        name: cert.name,
        provider: cert.provider,
        examDate: cert.examDate,
        status,
        notes: cert.notes,
        resourceUrl: cert.resourceUrl,
      });
      await load();
      toast(status === "COMPLETED" ? `Congrats on ${cert.name}! 🎉` : "Status updated");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to update status", "error");
    }
  }

  async function handleDelete(cert: Certification) {
    const ok = await confirm({
      title: "Delete certification?",
      message: `“${cert.name}” will be removed. This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/certifications/${cert.id}`);
      await load();
      toast("Certification deleted");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete", "error");
    }
  }

  const counts = Object.fromEntries(STATUSES.map((s) => [s, certifications.filter((c) => c.status === s).length])) as Record<
    CertStatus,
    number
  >;
  const visible = filter === "ALL" ? certifications : certifications.filter((c) => c.status === filter);

  return (
    <div>
      <PageHeader
        title="Certifications"
        description="Plan, study for, and celebrate the certifications that boost your career."
        actions={
          <Button onClick={openNew}>
            <PlusIcon className="h-4 w-4" /> Add certification
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        {STATUSES.map((s) => (
          <Card key={s} className="relative overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-1 ${STATUS[s].bar}`} />
            <p className="text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">{STATUS[s].label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-white">{counts[s]}</p>
          </Card>
        ))}
      </div>

      {certifications.length > 0 && (
        <div className="mb-6 inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          {(["ALL", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === s
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              {s === "ALL" ? `All (${certifications.length})` : STATUS[s].label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : certifications.length === 0 ? (
        <EmptyState
          icon={<AwardIcon className="h-6 w-6" />}
          title="No certifications yet"
          description="Track an exam you're planning, studying for, or already passed — like AWS Cloud Practitioner or Google Data Analytics."
          action={
            <Button onClick={openNew}>
              <PlusIcon className="h-4 w-4" /> Add certification
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState title={`No ${filter === "ALL" ? "" : STATUS[filter].label.toLowerCase()} certifications`} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((cert) => {
            const exam = cert.examDate ? examLabel(cert.examDate, cert.status) : null;
            return (
              <Card key={cert.id} className="flex flex-col">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      cert.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <AwardIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{cert.name}</h3>
                    {cert.provider && <p className="text-sm text-slate-500 dark:text-slate-400">{cert.provider}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(cert)}
                      aria-label="Edit"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void handleDelete(cert)}
                      aria-label="Delete"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {exam && (
                  <p
                    className={`mt-4 inline-flex items-center gap-1.5 text-sm ${
                      exam.urgent ? "font-medium text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <CalendarIcon className="h-4 w-4" /> {exam.text}
                  </p>
                )}
                {cert.notes && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{cert.notes}</p>}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 [&:not(:first-child)]:mt-4">
                  <select
                    value={cert.status}
                    onChange={(e) => void updateStatus(cert, e.target.value as CertStatus)}
                    aria-label="Status"
                    className="rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-7 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS[s].label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-3">
                    <Badge tone={STATUS[cert.status].tone}>{STATUS[cert.status].label}</Badge>
                    {cert.resourceUrl && (
                      <a
                        href={cert.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Study guide <ExternalLinkIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit certification" : "Add certification"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="cert-form" disabled={saving || !form.name.trim()}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add certification"}
            </Button>
          </>
        }
      >
        <form id="cert-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                type="text"
                required
                autoFocus
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

          <Field label="Status">
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    form.status === s
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
                  }`}
                >
                  {STATUS[s].label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={form.status === "COMPLETED" ? "Date passed" : "Exam date"}>
              <input
                type="date"
                value={form.examDate}
                onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Study resource">
              <input
                type="text"
                inputMode="url"
                placeholder="Link to study guide or exam page"
                value={form.resourceUrl}
                onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              rows={3}
              placeholder="Study plan, weak areas, score..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass}
            />
          </Field>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
