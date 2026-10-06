import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { api, ApiError } from "../lib/api";
import type { PublicPortfolio as PublicPortfolioData, ProfileComment } from "../lib/types";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button, buttonClass } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Skeleton } from "../components/ui/Skeleton";
import { inputClass } from "../components/ui/Field";
import {
  AwardIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GithubIcon,
  GlobeIcon,
  LinkedinIcon,
  MapPinIcon,
  MessageSquareIcon,
  TrashIcon,
} from "../components/icons";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PublicPortfolio() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast, confirm } = useUi();
  const [data, setData] = useState<PublicPortfolioData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const loadComments = useCallback(() => {
    if (!slug) return Promise.resolve();
    return api
      .get<{ comments: ProfileComment[] }>(`/public/${slug}/comments`)
      .then((res) => setComments(res.comments))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    api
      .get<PublicPortfolioData>(`/public/${slug}`)
      .then((d) => {
        setData(d);
        document.title = `${d.name}${d.headline ? ` — ${d.headline}` : ""} | Student Career Platform`;
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));

    void loadComments();
  }, [slug, loadComments]);

  async function handleCommentSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!slug || commentText.trim().length === 0) return;

    setCommentError(null);
    setPosting(true);

    try {
      await api.post(`/public/${slug}/comments`, { body: commentText.trim() });
      setCommentText("");
      await loadComments();
      toast("Comment posted");
    } catch (err) {
      setCommentError(err instanceof ApiError ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  async function handleCommentDelete(commentId: string) {
    if (!slug) return;
    const ok = await confirm({ title: "Delete comment?", confirmLabel: "Delete", danger: true });
    if (!ok) return;

    try {
      await api.delete(`/public/${slug}/comments/${commentId}`);
      await loadComments();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete comment", "error");
    }
  }

  function copyLink() {
    void navigator.clipboard.writeText(window.location.href).then(() => toast("Link copied to clipboard"));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-16 sm:px-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <Skeleton className="mt-8 h-48" />
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">404</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Portfolio not found</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">No portfolio exists at this URL.</p>
          <Link to="/directory" className={`${buttonClass()} mt-6`}>
            Browse students
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === data.userId;
  const links = [
    data.github && { href: data.github, label: "GitHub", icon: GithubIcon },
    data.linkedin && { href: data.linkedin, label: "LinkedIn", icon: LinkedinIcon },
    data.website && { href: data.website, label: "Website", icon: GlobeIcon },
  ].filter(Boolean) as { href: string; label: string; icon: typeof GithubIcon }[];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      {isOwner && (
        <div className="border-b border-blue-100 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm sm:px-6">
            <p className="text-blue-800 dark:text-blue-200">This is how others see your portfolio.</p>
            <Link to="/profile" className="font-medium text-blue-700 hover:underline dark:text-blue-300">
              Edit profile →
            </Link>
          </div>
        </div>
      )}

      <header className="relative overflow-hidden bg-white dark:bg-slate-900">
        <div className="h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 sm:h-44" />
        <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="inline-block w-fit rounded-full ring-4 ring-white dark:ring-slate-900">
              <Avatar name={data.name} size="xl" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={copyLink}>
                <CopyIcon className="h-4 w-4" /> Share
              </Button>
              {data.resumeUrl && (
                <a href={data.resumeUrl} target="_blank" rel="noreferrer" className={buttonClass("primary", "sm")}>
                  <FileTextIcon className="h-4 w-4" /> Resume
                </a>
              )}
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{data.name}</h1>
          {data.headline && <p className="mt-1 text-lg text-slate-600 dark:text-slate-300">{data.headline}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            {data.school && (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="h-4 w-4" /> {data.school}
              </span>
            )}
            {data.gradYear && <span>Class of {data.gradYear}</span>}
            {links.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
              >
                <Icon className="h-4 w-4" /> {label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        {data.bio && (
          <Section title="About">
            <p className="whitespace-pre-line text-base leading-relaxed text-slate-700 dark:text-slate-300">{data.bio}</p>
          </Section>
        )}

        {data.skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section title={`Projects (${data.projects.length})`}>
          {data.projects.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No projects yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {data.projects.map((project) => (
                <Card key={project.id} padded={false} className="flex flex-col overflow-hidden">
                  {project.imageUrl && (
                    <img src={project.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{project.title}</h3>
                    {project.description && (
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{project.description}</p>
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
                          <GithubIcon className="h-4 w-4" /> Source code
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>

        {data.certifications.length > 0 && (
          <Section title="Certifications">
            <div className="grid gap-3 sm:grid-cols-2">
              {data.certifications.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <AwardIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {[c.provider, c.examDate && new Date(c.examDate).getFullYear()].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title={`Comments (${comments.length})`}>
          {user ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <Avatar name={user.name} size="sm" />
              <div className="flex-1 space-y-2">
                <textarea
                  rows={3}
                  placeholder={isOwner ? "Add a note..." : `Leave encouraging feedback for ${data.name.split(" ")[0]}...`}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className={inputClass}
                />
                {commentError && <p className="text-sm text-red-600 dark:text-red-400">{commentError}</p>}
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={posting || commentText.trim().length === 0}>
                    {posting ? "Posting..." : "Post comment"}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                Log in
              </Link>{" "}
              or{" "}
              <Link to="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                create an account
              </Link>{" "}
              to leave a comment.
            </div>
          )}

          <div className="mt-6 space-y-4">
            {comments.length === 0 && (
              <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <MessageSquareIcon className="h-4 w-4" /> No comments yet — be the first to leave feedback.
              </p>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar name={comment.authorName} size="sm" />
                <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{comment.authorName}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</p>
                    </div>
                    {user && (user.id === comment.authorId || isOwner) && (
                      <button
                        onClick={() => void handleCommentDelete(comment.id)}
                        aria-label="Delete comment"
                        className="rounded p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{comment.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
