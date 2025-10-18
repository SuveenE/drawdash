'use client';

import { DEFAULT_USER_ID, fetchProjects } from '@/actions/projects';
import { useQuery } from '@tanstack/react-query';

export function useProject(projectId: string, userId: string = DEFAULT_USER_ID) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await fetchProjects(userId);
      const project = response.projects.find((p) => p.id === projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      return project;
    },
    enabled: !!projectId,
  });
}
