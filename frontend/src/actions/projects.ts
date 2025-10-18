'use client';

export const DEFAULT_USER_ID = '1824ad37-303d-4505-b210-d294295d1f95';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  snapshot?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface CreateProjectRequest {
  user_id: string;
  name: string;
  description?: string;
  snapshot?: Record<string, unknown>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  snapshot?: Record<string, unknown>;
}

export async function fetchProjects(userId: string): Promise<ProjectsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const response = await fetch(`${apiUrl}/api/projects/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch projects');
  }

  return response.json();
}

export async function createProject(projectData: CreateProjectRequest): Promise<Project> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const response = await fetch(`${apiUrl}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create project');
  }

  return response.json();
}

export async function updateProject(
  projectId: string,
  userId: string,
  projectData: UpdateProjectRequest,
): Promise<Project> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const response = await fetch(`${apiUrl}/api/projects/${projectId}?user_id=${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update project');
  }

  return response.json();
}
