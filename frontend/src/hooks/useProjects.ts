'use client';

import { DEFAULT_USER_ID, fetchProjects } from '@/actions/projects';
import { useQuery } from '@tanstack/react-query';

export function useProjects(userId: string = DEFAULT_USER_ID) {
  return useQuery({
    queryKey: ['projects', userId],
    queryFn: () => fetchProjects(userId),
  });
}
