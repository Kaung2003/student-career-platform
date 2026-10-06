import { useEffect, useState } from "react";
import { useUi } from "../../context/UiContext";
import { api, ApiError } from "../../lib/api";
import type { AdminComment } from "../../lib/types";
import { PageHeader } from "../../components/PageHeader";
import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { inputClass } from "../../components/ui/Field";
import { ExternalLinkIcon, MessageSquareIcon, SearchIcon, TrashIcon } from "../../components/icons";

export function AdminComments() {
  const { toast, confirm } = useUi();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(() => {
      const q = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      api
        .get<{ comments: AdminComment[] }>(`/admin/comments${q}`)
        .then((res) => setComments(res.comments))
        .catch(() => setComments([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  async function remove(comment: AdminComment) {
    const ok = await confirm({
      title: "Remove comment?",
      message: `This removes ${comment.authorName}'s comment from ${comment.profileName}'s portfolio.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/comments/${comment.id}`);
      setComments((list) => list.filter((c) => c.id !== comment.id));
      toast("Comment removed");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div>
      <PageHeader title="Comments" description="Moderate comments left on student portfolios. Newest first." />

      <div className="relative mb-5 max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search comment text..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} pl-9`}
        />
      </div>

      {loading ? (
        <Skeleton className="h-80" />
      ) : comments.length === 0 ? (
        <EmptyState icon={<MessageSquareIcon className="h-6 w-6" />} title="No comments found" />
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 px-5 py-4">
              <Avatar name={c.authorName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-white">{c.authorName}</span> on{" "}
                  <a
                    href={`/p/${c.profileSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {c.profileName}'s portfolio <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                  <span className="ml-2 text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                </p>
                <p className="mt-1.5 whitespace-pre-line text-sm text-slate-800 dark:text-slate-200">{c.body}</p>
              </div>
              <button
                onClick={() => void remove(c)}
                aria-label="Remove comment"
                className="self-start rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
