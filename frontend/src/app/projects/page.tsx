'use client';

import { useState } from 'react';

import { DEFAULT_USER_ID } from '@/actions/projects';
import { useProjects } from '@/hooks/useProjects';

import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectCard } from '@/components/projects/project-card';
import { Button } from '@/components/ui/button';

export default function ProjectsPage() {
  const { data, isLoading, error } = useProjects(DEFAULT_USER_ID);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Button onClick={() => setIsDialogOpen(true)}>New Project</Button>
      </div>

      {isLoading && <p className="text-gray-600">Loading projects...</p>}

      {error && <p className="text-red-600">Error loading projects: {error.message}</p>}

      {data && data.projects.length === 0 && (
        <p className="text-gray-600">No projects found. Create your first drawing project!</p>
      )}

      {data && data.projects.length > 0 && (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          {data.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} showOverlay={true} />
    </div>
  );
}
