import { useEffect, useState, type SubmitEvent } from "react";
import { useUi } from "../../context/UiContext";
import { api, ApiError } from "../../lib/api";
import type { AdminQuestion, InterviewCategory } from "../../lib/types";
import { PageHeader } from "../../components/PageHeader";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field, inputClass } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { HelpCircleIcon, PencilIcon, PlusIcon, TrashIcon } from "../../components/icons";
import { CATEGORIES } from "./adminLabels";
import { useI18n } from "../../i18n/I18nContext";
const CATEGORY_TONE: Record<InterviewCategory, BadgeTone> = { BEHAVIORAL: "violet", TECHNICAL: "blue", SITUATIONAL: "amber" };

const emptyForm = { category: "BEHAVIORAL" as InterviewCategory, prompt: "", tip: "" };

export function AdminQuestions() {
  const { toast, confirm } = useUi();
  const { t } = useI18n();
  const categoryLabel = (c: InterviewCategory) => t(`interview.category.${c}`);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InterviewCategory | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    return api
      .get<{ questions: AdminQuestion[] }>("/admin/questions")
      .then((res) => setQuestions(res.questions))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    void load();
  }, []);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm, category: filter || "BEHAVIORAL" });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(q: AdminQuestion) {
    setEditingId(q.id);
    setForm({ category: q.category, prompt: q.prompt, tip: q.tip ?? "" });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { category: form.category, prompt: form.prompt.trim(), tip: form.tip.trim() || null };
      if (editingId) {
        await api.put(`/admin/questions/${editingId}`, payload);
      } else {
        await api.post("/admin/questions", payload);
      }
      await load();
      setModalOpen(false);
      toast(editingId ? t("admin.questions.updated") : t("admin.questions.added"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.questions.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(q: AdminQuestion) {
    const ok = await confirm({
      title: t("admin.questions.deleteTitle"),
      message:
        q.attempts > 0
          ? t("admin.questions.deleteWithAnswers", { count: q.attempts })
          : t("admin.questions.deleteNoAnswers"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/questions/${q.id}`);
      await load();
      toast(t("admin.questions.deleted"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("admin.users.deleteFailed"), "error");
    }
  }

  const visible = filter ? questions.filter((q) => q.category === filter) : questions;

  return (
    <div>
      <PageHeader
        title={t("admin.questions.title")}
        description={t("admin.questions.description")}
        actions={
          <Button onClick={openNew}>
            <PlusIcon className="h-4 w-4" /> {t("admin.questions.add")}
          </Button>
        }
      />

      <div className="mb-5 inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
        {(["", ...CATEGORIES] as const).map((c) => (
          <button
            key={c || "ALL"}
            onClick={() => setFilter(c)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === c
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {c ? categoryLabel(c) : t("interview.category.ALL")}{" "}
            <span className="tabular-nums text-slate-400">
              {c ? questions.filter((q) => q.category === c).length : questions.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-80" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<HelpCircleIcon className="h-6 w-6" />}
          title={t("admin.questions.emptyTitle")}
          action={
            <Button onClick={openNew}>
              <PlusIcon className="h-4 w-4" /> {t("admin.questions.add")}
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {visible.map((q) => (
            <div key={q.id} className="flex items-start gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={CATEGORY_TONE[q.category]}>{categoryLabel(q.category)}</Badge>
                  <span className="text-xs text-slate-400">
                    {t("admin.questions.answers", { count: q.attempts })}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{q.prompt}</p>
                {q.tip && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("admin.questions.tip", { tip: q.tip })}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => openEdit(q)}
                  aria-label={t("admin.questions.edit")}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => void remove(q)}
                  aria-label={t("admin.questions.delete")}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t("admin.questions.edit") : t("admin.questions.add")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="question-form" disabled={saving || form.prompt.trim().length < 5}>
              {saving ? t("common.saving") : editingId ? t("common.saveChanges") : t("admin.questions.add")}
            </Button>
          </>
        }
      >
        <form id="question-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label={t("admin.questions.category")}>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, category: c })}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    form.category === c
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
                  }`}
                >
                  {categoryLabel(c)}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t("admin.questions.question")}>
            <textarea
              rows={3}
              required
              autoFocus
              placeholder={t("admin.questions.questionPlaceholder")}
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t("admin.questions.tipLabel")} hint={t("admin.questions.tipHint")}>
            <textarea
              rows={2}
              placeholder={t("admin.questions.tipPlaceholder")}
              value={form.tip}
              onChange={(e) => setForm({ ...form, tip: e.target.value })}
              className={inputClass}
            />
          </Field>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
