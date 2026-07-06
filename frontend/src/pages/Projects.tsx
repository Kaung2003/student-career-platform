import { useEffect, useState, type SubmitEvent } from "react";
import { Navbar } from "../components/Navbar";
import { api, ApiError } from "../lib/api";
import type { Project } from "../lib/types";

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <p className="mt-1 text-gray-500">Showcase the work that appears on your public portfolio.</p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6"
        >
          <h2 className="font-medium text-gray-900">{editingId ? "Edit project" : "Add a project"}</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tech stack (comma-separated)</label>
            <input
              type="text"
              placeholder="React, Node.js, PostgreSQL"
              value={form.techStack}
              onChange={(e) => setForm({ ...form, techStack: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Live URL</label>
              <input
                type="text"
                value={form.projectUrl}
                onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">GitHub URL</label>
              <input
                type="text"
                value={form.githubUrl}
                onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update project" : "Add project"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 space-y-4">
          {loading && <p className="text-gray-500">Loading...</p>}
          {!loading && projects.length === 0 && (
            <p className="text-gray-500">No projects yet. Add your first one above.</p>
          )}

          {projects.map((project) => (
            <div key={project.id} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-gray-900">{project.title}</h3>
                <div className="flex shrink-0 gap-3 text-sm">
                  <button onClick={() => startEdit(project)} className="text-gray-600 hover:text-gray-900">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-800">
                    Delete
                  </button>
                </div>
              </div>
              {project.description && <p className="mt-1 text-sm text-gray-600">{project.description}</p>}
              {project.techStack.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <span key={tech} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-4 text-sm">
                {project.projectUrl && (
                  <a href={project.projectUrl} target="_blank" rel="noreferrer" className="text-gray-900 underline">
                    Live
                  </a>
                )}
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-gray-900 underline">
                    GitHub
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
