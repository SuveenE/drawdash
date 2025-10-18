'use client';

export interface ImagePair {
  id: string;
  project_id: string;
  input_url: string;
  input_mime_type?: string;
  input_width?: number;
  input_height?: number;
  output_url?: string;
  output_mime_type?: string;
  output_width?: number;
  output_height?: number;
  prompt_text?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ImagePairsResponse {
  image_pairs: ImagePair[];
}

export async function fetchImagePairs(projectId: string): Promise<ImagePairsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const response = await fetch(`${apiUrl}/api/image-pairs/${projectId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch image pairs');
  }

  return response.json();
}
