import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import type { PublicPortfolio as PublicPortfolioData } from "../lib/types";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export function PublicPortfolio() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicPortfolioData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

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
  }, [slug]);

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
      </div>
    </div>
  );
}
