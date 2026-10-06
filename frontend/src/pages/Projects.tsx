import { useEffect, useState, type SubmitEvent } from "react";
import { useUi } from "../context/UiContext";
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
      toast(editingId ? "Project updated" : "Project added");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: Project) {
    const ok = await confirm({
      title: "Delete project?",
      message: `“${project.title}” will be removed from your portfolio. This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/projects/${project.id}`);
      await loadProjects();
      toast("Project deleted");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete project", "error");
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
        title="Projects"
        description="Showcase the work that appears on your public portfolio."
        actions={
          <Button onClick={openNew}>
            <PlusIcon className="h-4 w-4" /> New project
          </Button>
        }
      />

      {projects.length > 3 && (
        <div className="relative mb-6 max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search projects or tech..."
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
          title="No projects yet"
          description="Projects are the heart of your portfolio. Add class projects, hackathon builds, or side projects."
          action={
            <Button onClick={openNew}>
              <PlusIcon className="h-4 w-4" /> Add your first project
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching projects" description="Try a different search term." />
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
                    aria-label="Edit project"
                    className="rounded-lg bg-white/90 p-2 text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:bg-slate-900/90 dark:text-slate-200"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void handleDelete(project)}
                    aria-label="Delete project"
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
                      <ExternalLinkIcon className="h-4 w-4" /> Live demo
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:underline dark:text-slate-400"
                    >
                      <GithubIcon className="h-4 w-4" /> Code
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
        title={editingId ? "Edit project" : "New project"}
        description="Describe what you built, how, and why it matters."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="project-form" disabled={saving || !form.title.trim()}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add project"}
            </Button>
          </>
        }
      >
        <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title">
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Campus Events App"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field
            label="Description"
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
              placeholder="What does it do? What was your role? What did you learn or achieve?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Tech stack">
            <TagInput
              value={form.techStack}
              onChange={(techStack) => setForm({ ...form, techStack })}
              placeholder="Type a technology and press Enter"
              suggestions={TECH_SUGGESTIONS}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Live URL">
              <input
                type="text"
                inputMode="url"
                placeholder="https://"
                value={form.projectUrl}
                onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="GitHub URL">
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

          <Field label="Cover image">
            <FileUploadField
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              uploadType="project-image"
              placeholder="Paste an image URL or upload"
              accept="image/*"
            />
          </Field>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
