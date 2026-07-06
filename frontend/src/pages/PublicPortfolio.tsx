import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import type { PublicPortfolio as PublicPortfolioData } from "../lib/types";

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
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>;
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-gray-500">
        <h1 className="text-xl font-medium text-gray-900">Portfolio not found</h1>
        <p>No portfolio exists at this URL.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">{data.name}</h1>
        {data.headline && <p className="mt-1 text-lg text-gray-600">{data.headline}</p>}

        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
          {data.school && <span>{data.school}</span>}
          {data.gradYear && <span>Class of {data.gradYear}</span>}
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          {data.github && (
            <a href={data.github} target="_blank" rel="noreferrer" className="text-gray-900 underline">
              GitHub
            </a>
          )}
          {data.linkedin && (
            <a href={data.linkedin} target="_blank" rel="noreferrer" className="text-gray-900 underline">
              LinkedIn
            </a>
          )}
          {data.website && (
            <a href={data.website} target="_blank" rel="noreferrer" className="text-gray-900 underline">
              Website
            </a>
          )}
        </div>

        {data.bio && <p className="mt-6 whitespace-pre-line text-gray-700">{data.bio}</p>}

        {data.skills.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                {skill}
              </span>
            ))}
          </div>
        )}

        <h2 className="mt-10 text-xl font-semibold text-gray-900">Projects</h2>

        {data.projects.length === 0 && <p className="mt-2 text-gray-500">No projects yet.</p>}

        <div className="mt-4 space-y-6">
          {data.projects.map((project) => (
            <div key={project.id} className="rounded-xl border border-gray-200 p-4 sm:p-6">
              <h3 className="font-medium text-gray-900">{project.title}</h3>
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
