import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { useI18n } from "../i18n/I18nContext";
import { formatNodes } from "../i18n/formatNodes";
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
  FolderIcon,
  FileTextIcon,
  GithubIcon,
  GlobeIcon,
  LinkedinIcon,
  MapPinIcon,
  MessageSquareIcon,
  SparklesIcon,
  TrashIcon,
} from "../components/icons";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <span className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

const COVERS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-fuchsia-600",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-cyan-600",
  "from-rose-500 to-pink-600",
];

/** A colour for projects without a screenshot, so the grid doesn't look empty. Neighbours never match. */
function coverFor(index: number) {
  return COVERS[index % COVERS.length];
}

export function PublicPortfolio() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast, confirm } = useUi();
  const { t, formatDate } = useI18n();
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
      toast(t("portfolio.commentPosted"));
    } catch (err) {
      setCommentError(err instanceof ApiError ? err.message : t("portfolio.postFailed"));
    } finally {
      setPosting(false);
    }
  }

  async function handleCommentDelete(commentId: string) {
    if (!slug) return;
    const ok = await confirm({ title: t("portfolio.deleteCommentTitle"), confirmLabel: t("common.delete"), danger: true });
    if (!ok) return;

    try {
      await api.delete(`/public/${slug}/comments/${commentId}`);
      await loadComments();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("portfolio.deleteFailed"), "error");
    }
  }

  function copyLink() {
    void navigator.clipboard.writeText(window.location.href).then(() => toast(t("portfolio.linkCopied")));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-16 sm:px-6">
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
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{t("portfolio.notFoundTitle")}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{t("portfolio.notFoundDescription")}</p>
          <Link to="/directory" className={`${buttonClass()} mt-6`}>
            {t("portfolio.browse")}
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === data.userId;
  const links = [
    data.github && { href: data.github, label: "GitHub", icon: GithubIcon },
    data.linkedin && { href: data.linkedin, label: "LinkedIn", icon: LinkedinIcon },
    data.website && { href: data.website, label: t("portfolio.website"), icon: GlobeIcon },
  ].filter(Boolean) as { href: string; label: string; icon: typeof GithubIcon }[];
  const stats = [
    { label: t("portfolio.statProjects"), value: data.projects.length, icon: FolderIcon },
    { label: t("portfolio.statSkills"), value: data.skills.length, icon: SparklesIcon },
    { label: t("portfolio.statCertifications"), value: data.certifications.length, icon: AwardIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      {isOwner && (
        <div className="border-b border-blue-100 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm sm:px-6">
            <p className="text-blue-800 dark:text-blue-200">{t("portfolio.ownerBanner")}</p>
            <Link to="/profile" className="font-medium text-blue-700 hover:underline dark:text-blue-300">
              {t("portfolio.editProfile")}
            </Link>
          </div>
        </div>
      )}

      {/* Banner: gradient with a soft dot grid, purely decorative. */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 sm:h-52">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
          {/* Identity card */}
          <aside className="-mt-20 lg:sticky lg:top-6 lg:self-start">
            <Card className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full ring-4 ring-white shadow-lg dark:ring-slate-900">
                  <Avatar name={data.name} size="xl" />
                </div>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{data.name}</h1>
                {data.headline && <p className="mt-1 text-slate-600 dark:text-slate-300">{data.headline}</p>}
                {data.openToWork && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("portfolio.openToWork")}
                  </span>
                )}
              </div>

              {(data.school || data.gradYear) && (
                <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t("portfolio.education")}</p>
                  <div className="mt-3 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                      <MapPinIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 text-sm">
                      {data.school && <p className="font-medium text-slate-900 dark:text-white">{data.school}</p>}
                      {data.gradYear && <p className="text-slate-500 dark:text-slate-400">{t("common.classOf", { year: data.gradYear })}</p>}
                    </div>
                  </div>
                </div>
              )}

              {links.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t("portfolio.links")}</p>
                  <ul className="mt-2 space-y-1">
                    {links.map(({ href, label, icon: Icon }) => (
                      <li key={label}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{label}</span>
                          <ExternalLinkIcon className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 grid gap-2">
                {data.resumeUrl && (
                  <a href={data.resumeUrl} target="_blank" rel="noreferrer" className={`${buttonClass("primary")} w-full justify-center`}>
                    <FileTextIcon className="h-4 w-4" /> {t("portfolio.resume")}
                  </a>
                )}
                <Button variant="secondary" onClick={copyLink} className="w-full justify-center">
                  <CopyIcon className="h-4 w-4" /> {t("portfolio.share")}
                </Button>
              </div>
            </Card>
          </aside>

          <main className="min-w-0 space-y-6 lg:pt-8">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <Card key={label} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{value}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  </div>
                </Card>
              ))}
            </div>

            {data.bio && (
              <Section title={t("portfolio.about")}>
                <p className="whitespace-pre-line text-base leading-relaxed text-slate-700 dark:text-slate-300">{data.bio}</p>
              </Section>
            )}

            {data.skills.length > 0 && (
              <Section title={t("portfolio.skills")}>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-3.5 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-blue-100 dark:from-blue-500/10 dark:to-indigo-500/10 dark:text-blue-300 dark:ring-blue-500/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            <Section title={t("portfolio.projects", { count: data.projects.length })}>
              {data.projects.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">{t("portfolio.noProjects")}</p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {data.projects.map((project, index) => (
                    <article
                      key={project.id}
                      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950"
                    >
                      {project.imageUrl ? (
                        <img src={project.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                      ) : (
                        <div className={`flex aspect-[16/9] items-center justify-center bg-gradient-to-br ${coverFor(index)}`}>
                          <span className="text-4xl font-bold text-white/90 drop-shadow">{project.title.trim().slice(0, 1).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {project.title}
                        </h3>
                        {project.description && (
                          <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{project.description}</p>
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
                        {(project.projectUrl || project.githubUrl) && (
                          <div className="mt-auto flex flex-wrap gap-2 pt-4">
                            {project.projectUrl && (
                              <a href={project.projectUrl} target="_blank" rel="noreferrer" className={buttonClass("primary", "sm")}>
                                <ExternalLinkIcon className="h-4 w-4" /> {t("portfolio.liveDemo")}
                              </a>
                            )}
                            {project.githubUrl && (
                              <a href={project.githubUrl} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                                <GithubIcon className="h-4 w-4" /> {t("portfolio.sourceCode")}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Section>

            {data.certifications.length > 0 && (
              <Section title={t("portfolio.certifications")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.certifications.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
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

            <Section title={t("portfolio.comments", { count: comments.length })}>
              {user?.role === "EMPLOYER" ? null : user ? (
                <form onSubmit={handleCommentSubmit} className="flex gap-3">
                  <Avatar name={user.name} size="sm" />
                  <div className="flex-1 space-y-2">
                    <textarea
                      rows={3}
                      placeholder={isOwner ? t("portfolio.notePlaceholder") : t("portfolio.commentPlaceholder", { name: data.name.split(" ")[0] ?? "" })}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className={inputClass}
                    />
                    {commentError && <p className="text-sm text-red-600 dark:text-red-400">{commentError}</p>}
                    <div className="flex justify-end">
                      <Button type="submit" size="sm" disabled={posting || commentText.trim().length === 0}>
                        {posting ? t("portfolio.posting") : t("portfolio.post")}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
                  {formatNodes(t("portfolio.loginToComment"), {
                    login: (
                      <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                        {t("common.logIn")}
                      </Link>
                    ),
                    register: (
                      <Link to="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                        {t("portfolio.createAccount")}
                      </Link>
                    ),
                  })}
                </div>
              )}

              <div className="mt-6 space-y-4">
                {comments.length === 0 && (
                  <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MessageSquareIcon className="h-4 w-4" /> {t("portfolio.noComments")}
                  </p>
                )}

                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar name={comment.authorName} size="sm" />
                    <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm bg-slate-50 p-4 dark:bg-slate-800/50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{comment.authorName}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(comment.createdAt)}</p>
                        </div>
                        {user && (user.id === comment.authorId || isOwner) && (
                          <button
                            onClick={() => void handleCommentDelete(comment.id)}
                            aria-label={t("portfolio.deleteComment")}
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
        </div>
      </div>

      <Footer />
    </div>
  );
}
