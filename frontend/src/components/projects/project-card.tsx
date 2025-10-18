'use client';

import { Project } from '@/actions/projects';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md">
      <h2 className="text-xl font-semibold text-gray-800">{project.name}</h2>
      {project.description && <p className="mt-2 text-sm text-gray-600">{project.description}</p>}
      <p className="mt-2 text-sm text-gray-500">
        Last Updated: {new Date(project.updated_at).toLocaleDateString()}
      </p>
    </div>
  );
}
