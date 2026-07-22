import { useEffect, useState, type SubmitEvent } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import type { PublicPortfolio as PublicPortfolioData, ProfileComment } from "../lib/types";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";

export function PublicPortfolio() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<PublicPortfolioData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  function loadComments() {
    if (!slug) return Promise.resolve();
    return api
      .get<{ comments: ProfileComment[] }>(`/public/${slug}/comments`)
      .then((res) => setComments(res.comments))
      .catch(() => {});
  }

  useEffect(() => {
    if (!slug) return;

    api
      .get<PublicPortfolioData>(`/public/${slug}`)
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));

    loadComments();
  }, [slug]);

  async function handleCommentSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!slug || commentText.trim().length === 0) return;

    setCommentError(null);
    setPosting(true);

    try {
      await api.post(`/public/${slug}/comments`, { body: commentText.trim() });
      setCommentText("");
      await loadComments();
    } catch (err) {
      setCommentError(err instanceof ApiError ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  async function handleCommentDelete(commentId: string) {
    if (!slug || !confirm("Delete this comment?")) return;

    try {
      await api.delete(`/public/${slug}/comments/${commentId}`);
      await loadComments();
    } catch (err) {
      setCommentError(err instanceof ApiError ? err.message : "Failed to delete comment");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Loading...
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        <h1 className="text-xl font-medium text-slate-900 dark:text-slate-100">Portfolio not found</h1>
        <p>No portfolio exists at this URL.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-slate-100">{data.name}</h1>
        {data.headline && <p className="mt-1 text-lg text-slate-600 dark:text-slate-400">{data.headline}</p>}

        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
          {data.school && <span>{data.school}</span>}
          {data.gradYear && <span>Class of {data.gradYear}</span>}
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          {data.github && (
            <a
              href={data.github}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              GitHub
            </a>
          )}
          {data.linkedin && (
            <a
              href={data.linkedin}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              LinkedIn
            </a>
          )}
          {data.website && (
            <a
              href={data.website}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Website
            </a>
          )}
        </div>

        {data.bio && <p className="mt-6 whitespace-pre-line text-slate-700 dark:text-slate-300">{data.bio}</p>}

        {data.skills.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        )}

        <h2 className="mt-10 text-xl font-semibold text-slate-900 dark:text-slate-100">Projects</h2>

        {data.projects.length === 0 && <p className="mt-2 text-slate-500 dark:text-slate-400">No projects yet.</p>}

        <div className="mt-4 space-y-6">
          {data.projects.map((project) => (
            <Card key={project.id}>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">{project.title}</h3>
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

        <h2 className="mt-10 text-xl font-semibold text-slate-900 dark:text-slate-100">Comments</h2>

        {user ? (
          <form onSubmit={handleCommentSubmit} className="mt-4 space-y-2">
            <textarea
              rows={3}
              placeholder={`Leave a comment for ${data.name}...`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {commentError && <p className="text-sm text-red-600 dark:text-red-400">{commentError}</p>}
            <Button type="submit" disabled={posting || commentText.trim().length === 0}>
              {posting ? "Posting..." : "Post comment"}
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            <a href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
              Log in
            </a>{" "}
            to leave a comment.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {comments.length === 0 && (
            <EmptyState title="No comments yet" description="Be the first to leave feedback on this portfolio." />
          )}

          {comments.map((comment) => (
            <Card key={comment.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{comment.authorName}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {user && (user.id === comment.authorId || user.id === data.userId) && (
                  <button
                    onClick={() => handleCommentDelete(comment.id)}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{comment.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
