import logging
from typing import Dict, List
from uuid import uuid4

from supabase._async.client import AsyncClient as Client

from app.models.project import Project, ProjectCreateRequest, ProjectUpdateRequest

log = logging.getLogger(__name__)


class ProjectService:
    async def get_projects_by_user_id(
        self, supabase_client: Client, user_id: str
    ) -> List[Project]:
        """
        Fetch all projects for a given user ID.

        Args:
            supabase_client: The Supabase client instance
            user_id: The user ID to fetch projects for

        Returns:
            List of Project objects for the user
        """
        log.info(f"Fetching projects for user_id: {user_id}")

        try:
            # Query the projects table
            response = (
                await supabase_client.table("projects")
                .select("*")
                .eq("user_id", user_id)
                .order("updated_at", desc=True)
                .execute()
            )

            if not response.data:
                log.info(f"No projects found for user_id: {user_id}")
                return []

            # Convert to Project models
            projects = [Project(**project_data) for project_data in response.data]
            log.info(f"Found {len(projects)} projects for user_id: {user_id}")

            return projects

        except Exception as e:
            log.error(f"Error fetching projects for user_id {user_id}: {e}")
            raise RuntimeError(f"Failed to fetch projects: {e}")

    async def create_project(
        self, supabase_client: Client, project_data: ProjectCreateRequest
    ) -> Project:
        """
        Create a new project.

        Args:
            supabase_client: The Supabase client instance
            project_data: The project data to create

        Returns:
            Created Project object
        """
        log.info(f"Creating project for user_id: {project_data.user_id}")

        try:
            # Prepare project data with generated ID
            new_project = {
                "id": str(uuid4()),
                "user_id": project_data.user_id,
                "name": project_data.name,
                "description": project_data.description,
                "snapshot": project_data.snapshot,
            }

            # Insert into projects table
            response = (
                await supabase_client.table("projects")
                .insert(new_project)
                .execute()
            )

            if not response.data or len(response.data) == 0:
                raise RuntimeError("Failed to create project: No data returned")

            project = Project(**response.data[0])
            log.info(f"Successfully created project with id: {project.id}")

            return project

        except Exception as e:
            log.error(f"Error creating project: {e}")
            raise RuntimeError(f"Failed to create project: {e}")

    async def update_project(
        self,
        supabase_client: Client,
        project_id: str,
        user_id: str,
        project_data: ProjectUpdateRequest,
    ) -> Project:
        """
        Update an existing project.

        Args:
            supabase_client: The Supabase client instance
            project_id: The ID of the project to update
            user_id: The user ID who owns the project (for authorization)
            project_data: The project data to update

        Returns:
            Updated Project object
        """
        log.info(f"Updating project {project_id} for user_id: {user_id}")

        try:
            # Prepare update data (only include non-None fields)
            update_data: Dict = {}
            if project_data.name is not None:
                update_data["name"] = project_data.name
            if project_data.description is not None:
                update_data["description"] = project_data.description
            if project_data.snapshot is not None:
                update_data["snapshot"] = project_data.snapshot

            if not update_data:
                raise RuntimeError("No fields to update")

            # Update the project (with user_id check for authorization)
            response = (
                await supabase_client.table("projects")
                .update(update_data)
                .eq("id", project_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not response.data or len(response.data) == 0:
                raise RuntimeError(
                    "Failed to update project: Project not found or unauthorized"
                )

            project = Project(**response.data[0])
            log.info(f"Successfully updated project with id: {project.id}")

            return project

        except Exception as e:
            log.error(f"Error updating project {project_id}: {e}")
            raise RuntimeError(f"Failed to update project: {e}")
