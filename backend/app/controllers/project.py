import logging

from fastapi import APIRouter, Header, HTTPException

from app.models.project import ProjectListResponse
from app.services.project import ProjectService
from app.utils.database import db_client

log = logging.getLogger(__name__)


class ProjectController:
    def __init__(self, service: ProjectService):
        self.router = APIRouter()
        self.service = service
        self.setup_routes()

    def setup_routes(self):
        router = self.router

        @router.get(
            "/{user_id}",
            response_model=ProjectListResponse,
        )
        async def get_projects(
            user_id: str,
            authorization: str = Header(None),
        ) -> ProjectListResponse:
            """
            Fetch all projects for a given user ID.
            """
            log.info(f"Fetching projects for user_id: {user_id}")
            try:
                # Extract token from authorization header
                token = authorization.replace("Bearer ", "") if authorization else ""

                # Get database client
                supabase_client = await db_client(token=token)

                # Fetch projects
                projects = await self.service.get_projects_by_user_id(
                    supabase_client=supabase_client, user_id=user_id
                )

                log.info(f"Successfully retrieved {len(projects)} projects")
                return ProjectListResponse(projects=projects)

            except RuntimeError as e:
                log.error(f"Service error: {e}")
                raise HTTPException(status_code=500, detail=str(e))
            except Exception as e:
                log.error(f"Unexpected error: {e}")
                raise HTTPException(
                    status_code=500, detail="An unexpected error occurred"
                )

