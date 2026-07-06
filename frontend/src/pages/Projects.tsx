import { useEffect, useState, type SubmitEvent } from "react";
import { Navbar } from "../components/Navbar";
import { api, ApiError } from "../lib/api";
import type { Project } from "../lib/types";
import { Card } from "../components/ui/Card";
import { Field, inputClass } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { FileUploadField } from "../components/ui/FileUploadField";

const emptyForm = {
  title: "",
  description: "",
  techStack: "",
  projectUrl: "",
  githubUrl: "",
  imageUrl: "",
};

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  function loadProjects() {
    return api.get<{ projects: Project[] }>("/projects").then((res) => setProjects(res.projects));
  }

  useEffect(() => {
    loadProjects().finally(() => setLoading(false));
  }, []);

  function startEdit(project: Project) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description ?? "",
      techStack: project.techStack.join(", "),
      projectUrl: project.projectUrl ?? "",
      githubUrl: project.githubUrl ?? "",
      imageUrl: project.imageUrl ?? "",
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
      title: form.title.trim(),
      description: form.description.trim() || null,
      techStack: form.techStack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
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
      cancelEdit();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    await api.delete(`/projects/${id}`);
    await loadProjects();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Projects</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Showcase the work that appears on your public portfolio.
        </p>

        <Card className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-medium text-slate-900 dark:text-slate-100">
              {editingId ? "Edit project" : "Add a project"}
            </h2>

            <Field label="Title">
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Tech stack (comma-separated)">
              <input
                type="text"
                placeholder="React, Node.js, PostgreSQL"
                value={form.techStack}
                onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Live URL">
                <input
                  type="text"
                  value={form.projectUrl}
                  onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="GitHub URL">
                <input
                  type="text"
                  value={form.githubUrl}
                  onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Image">
              <FileUploadField
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                uploadType="project-image"
                placeholder="Paste a URL or upload an image"
                accept="image/*"
              />
            </Field>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update project" : "Add project"}
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
          {!loading && projects.length === 0 && (
            <EmptyState title="No projects yet" description="Add your first one above." />
          )}

          {projects.map((project) => (
            <Card key={project.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-slate-900 dark:text-slate-100">{project.title}</h3>
                <div className="flex shrink-0 gap-3 text-sm">
                  <button
                    onClick={() => startEdit(project)}
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {project.description && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{project.description}</p>
              )}
              {project.techStack.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <Badge key={tech}>{tech}</Badge>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-4 text-sm">
                {project.projectUrl && (
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Live
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
