'use client';

import { DEFAULT_USER_ID } from '@/actions/projects';
import { useProjects } from '@/hooks/useProjects';

export default function ProjectsPage() {
  const { data, isLoading, error } = useProjects(DEFAULT_USER_ID);

  return (
    <div className="flex h-full flex-col p-8">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Projects</h1>

      {isLoading && <p className="text-gray-600">Loading projects...</p>}

      {error && <p className="text-red-600">Error loading projects: {error.message}</p>}

      {data && data.projects.length === 0 && (
        <p className="text-gray-600">No projects found. Create your first drawing project!</p>
      )}

      {data && data.projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-800">{project.name}</h2>
              <p className="mt-2 text-sm text-gray-500">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Updated: {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
