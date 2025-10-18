'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Project } from '@/actions/projects';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md">
        <div className="relative h-48 w-full bg-gradient-to-br from-blue-50 to-purple-50">
          <Image
            src={project.icon_url || '/projects/internet.png'}
            alt="Project thumbnail"
            fill
            className="object-contain p-4"
          />
        </div>
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-800">{project.name}</h2>
          {project.description && (
            <p className="mt-2 text-sm text-gray-600">{project.description}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Last Updated: {new Date(project.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
