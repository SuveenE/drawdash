'use client';

import { fetchImagePairs } from '@/actions/image-pairs';
import { useQuery } from '@tanstack/react-query';

export function useImagePairs(projectId: string) {
  return useQuery({
    queryKey: ['image-pairs', projectId],
    queryFn: () => fetchImagePairs(projectId),
    enabled: !!projectId,
  });
}
