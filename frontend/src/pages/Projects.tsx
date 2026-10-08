import { useEffect, useState, type SubmitEvent } from "react";
import { useUi } from "../context/UiContext";
import { useI18n } from "../i18n/I18nContext";
import { api, ApiError } from "../lib/api";
import type { Project } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { AiImproveButton } from "../components/AiImproveButton";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { TagInput } from "../components/ui/TagInput";
import { FileUploadField } from "../components/ui/FileUploadField";
import { ExternalLinkIcon, FolderIcon, GithubIcon, PencilIcon, PlusIcon, SearchIcon, TrashIcon } from "../components/icons";

interface FormState {
  title: string;
  description: string;
  techStack: string[];
  projectUrl: string;
  githubUrl: string;
  imageUrl: string;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  techStack: [],
  projectUrl: "",
  githubUrl: "",
  imageUrl: "",
};

const TECH_SUGGESTIONS = ["React", "TypeScript", "Node.js", "Python", "PostgreSQL", "Tailwind CSS", "Firebase", "Next.js"];

export function Projects() {
  const { toast, confirm } = useUi();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");

  function loadProjects() {
    return api.get<{ projects: Project[] }>("/projects").then((res) => setProjects(res.projects));
  }

  useEffect(() => {
    loadProjects().finally(() => setLoading(false));
  }, []);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(project: Project) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description ?? "",
      techStack: project.techStack,
      projectUrl: project.projectUrl ?? "",
      githubUrl: project.githubUrl ?? "",
      imageUrl: project.imageUrl ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      techStack: form.techStack,
      projectUrl: form.projectUrl.trim() || null,
      githubUrl: form.githubUrl.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
    };

    try {
      if (editingId) {
        await api.put(`/projects/${editingId}`, payload);
      } else {
        await api.post("/projects", payload);
      }
      await loadProjects();
      setModalOpen(false);
      toast(editingId ? t("projects.updated") : t("projects.added"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("projects.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: Project) {
    const ok = await confirm({
      title: t("projects.deleteTitle"),
      message: t("projects.deleteMessage", { title: project.title }),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/projects/${project.id}`);
      await loadProjects();
      toast(t("projects.deleted"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("projects.deleteFailed"), "error");
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? projects.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.techStack.some((t) => t.toLowerCase().includes(q)),
      )
    : projects;

  return (
    <div>
      <PageHeader
        title={t("projects.title")}
        description={t("projects.description")}
        actions={
          <Button onClick={openNew}>
            <PlusIcon className="h-4 w-4" /> {t("projects.new")}
          </Button>
        }
      />

      {projects.length > 3 && (
        <div className="relative mb-6 max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder={t("projects.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="h-6 w-6" />}
          title={t("projects.emptyTitle")}
          description={t("projects.emptyDescription")}
          action={
            <Button onClick={openNew}>
              <PlusIcon className="h-4 w-4" /> {t("projects.addFirst")}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("projects.noMatchTitle")} description={t("projects.noMatchDescription")} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Card key={project.id} padded={false} className="group flex flex-col overflow-hidden">
              <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                {project.imageUrl ? (
                  <img src={project.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl font-bold text-slate-300 dark:text-slate-700">
                    {project.title.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(project)}
                    aria-label={t("projects.edit")}
                    className="rounded-lg bg-white/90 p-2 text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:bg-slate-900/90 dark:text-slate-200"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void handleDelete(project)}
                    aria-label={t("projects.delete")}
                    className="rounded-lg bg-white/90 p-2 text-red-600 shadow-sm backdrop-blur hover:bg-white dark:bg-slate-900/90 dark:text-red-400"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white">{project.title}</h3>
                {project.description && (
                  <p className="mt-1.5 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{project.description}</p>
                )}
                {project.techStack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.techStack.map((tech) => (
                      <Badge key={tech} tone="blue">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-auto flex gap-4 pt-4 text-sm">
                  {project.projectUrl && (
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      <ExternalLinkIcon className="h-4 w-4" /> {t("projects.liveDemo")}
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:underline dark:text-slate-400"
                    >
                      <GithubIcon className="h-4 w-4" /> {t("projects.code")}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t("projects.edit") : t("projects.new")}
        description={t("projects.modalDescription")}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="project-form" disabled={saving || !form.title.trim()}>
              {saving ? t("common.saving") : editingId ? t("common.saveChanges") : t("projects.add")}
            </Button>
          </>
        }
      >
        <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label={t("projects.fieldTitle")}>
            <input
              type="text"
              required
              autoFocus
              placeholder={t("projects.titlePlaceholder")}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field
            label={t("projects.fieldDescription")}
            action={
              <AiImproveButton
                kind="project"
                text={form.description}
                context={[form.title && `Project: ${form.title}`, form.techStack.length && `Built with: ${form.techStack.join(", ")}`]
                  .filter(Boolean)
                  .join(". ")}
                onResult={(description) => setForm((f) => ({ ...f, description }))}
              />
            }
          >
            <textarea
              rows={4}
              placeholder={t("projects.descriptionPlaceholder")}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label={t("projects.techStack")}>
            <TagInput
              value={form.techStack}
              onChange={(techStack) => setForm({ ...form, techStack })}
              placeholder={t("projects.techPlaceholder")}
              suggestions={TECH_SUGGESTIONS}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("projects.liveUrl")}>
              <input
                type="text"
                inputMode="url"
                placeholder="https://"
                value={form.projectUrl}
                onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label={t("projects.githubUrl")}>
              <input
                type="text"
                inputMode="url"
                placeholder="https://github.com/..."
                value={form.githubUrl}
                onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label={t("projects.coverImage")}>
            <FileUploadField
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              uploadType="project-image"
              placeholder={t("projects.coverPlaceholder")}
              accept="image/*"
            />
          </Field>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
