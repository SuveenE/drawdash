import logging
from typing import List

from supabase._async.client import AsyncClient as Client

from app.models.project import Project

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
