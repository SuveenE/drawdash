'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { DEFAULT_USER_ID } from '@/actions/projects';
import { useImagePairs } from '@/hooks/useImagePairs';
import { useProject } from '@/hooks/useProject';

import { ImagePairCard } from '@/components/projects/image-pair-card';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.project_id as string;

  const {
    data: project,
    isLoading: isLoadingProject,
    error: projectError,
  } = useProject(projectId, DEFAULT_USER_ID);

  const {
    data: imagePairsData,
    isLoading: isLoadingImagePairs,
    error: imagePairsError,
  } = useImagePairs(projectId);

  const isLoading = isLoadingProject || isLoadingImagePairs;
  const error = projectError || imagePairsError;

  return (
    <div className="flex h-full flex-col p-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm">
        <Link href="/projects" className="text-blue-600 hover:underline">
          Projects
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">{project?.name || projectId}</span>
      </nav>

      {/* Project Header */}
      {project && (
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{project.name}</h1>
          {project.description && <p className="text-gray-600">{project.description}</p>}
          <div className="mt-2 text-sm text-gray-500">
            <p>Last Updated: {new Date(project.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <p className="text-gray-600">Loading...</p>}

      {/* Error State */}
      {error && <p className="text-red-600">Error: {error.message}</p>}

      {/* Generations Section */}
      {imagePairsData && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Generations ({imagePairsData.image_pairs.length})
          </h2>

          {imagePairsData.image_pairs.length === 0 ? (
            <p className="text-gray-600">No generations found for this project.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {imagePairsData.image_pairs.map((imagePair) => (
                <ImagePairCard key={imagePair.id} imagePair={imagePair} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
