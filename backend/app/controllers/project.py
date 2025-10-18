import logging

from fastapi import APIRouter, Header, HTTPException

from app.models.project import (IconGenerationRequest, IconGenerationResponse,
                                Project, ProjectCreateRequest,
                                ProjectListResponse, ProjectUpdateRequest)
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

        @router.post(
            "",
            response_model=Project,
            status_code=201,
        )
        async def create_project(
            project_data: ProjectCreateRequest,
            authorization: str = Header(None),
        ) -> Project:
            """
            Create a new project.
            """
            log.info(f"Creating project for user_id: {project_data.user_id}")
            try:
                # Extract token from authorization header
                token = authorization.replace("Bearer ", "") if authorization else ""

                # Get database client
                supabase_client = await db_client(token=token)

                # Create project
                project = await self.service.create_project(
                    supabase_client=supabase_client, project_data=project_data
                )

                log.info(f"Successfully created project with id: {project.id}")
                return project

            except RuntimeError as e:
                log.error(f"Service error: {e}")
                raise HTTPException(status_code=500, detail=str(e))
            except Exception as e:
                log.error(f"Unexpected error: {e}")
                raise HTTPException(
                    status_code=500, detail="An unexpected error occurred"
                )

        @router.put(
            "/{project_id}",
            response_model=Project,
        )
        async def update_project(
            project_id: str,
            project_data: ProjectUpdateRequest,
            user_id: str,
            authorization: str = Header(None),
        ) -> Project:
            """
            Update an existing project.
            """
            log.info(f"Updating project {project_id} for user_id: {user_id}")
            try:
                # Extract token from authorization header
                token = authorization.replace("Bearer ", "") if authorization else ""

                # Get database client
                supabase_client = await db_client(token=token)

                # Update project
                project = await self.service.update_project(
                    supabase_client=supabase_client,
                    project_id=project_id,
                    user_id=user_id,
                    project_data=project_data,
                )

                log.info(f"Successfully updated project with id: {project.id}")
                return project

            except RuntimeError as e:
                log.error(f"Service error: {e}")
                # Check if it's an authorization error
                if "unauthorized" in str(e).lower() or "not found" in str(e).lower():
                    raise HTTPException(status_code=404, detail=str(e))
                raise HTTPException(status_code=500, detail=str(e))
            except Exception as e:
                log.error(f"Unexpected error: {e}")
                raise HTTPException(
                    status_code=500, detail="An unexpected error occurred"
                )

        @router.post(
            "/generate-icon",
            response_model=IconGenerationResponse,
            status_code=200,
        )
        async def generate_3d_icon(
            request: IconGenerationRequest,
            authorization: str = Header(None),
        ) -> IconGenerationResponse:
            """
            Generate a 3D icon using Fal AI based on a text prompt and save it with a topic description.

            This endpoint uses Fal AI's FLUX model to generate high-quality 3D-style icons
            and OpenAI to generate a concise topic description. Both are saved to the project.
            """
            log.info(
                f"Generating 3D icon and description for project: {request.project_id}"
            )
            try:
                # Extract token from authorization header
                token = authorization.replace("Bearer ", "") if authorization else ""

                # Get database client
                supabase_client = await db_client(token=token)

                # Generate the icon and description using the service
                icon_response = await self.service.generate_3d_icon(
                    supabase_client=supabase_client, request=request
                )

                log.info(
                    f"Successfully generated 3D icon and description for project: {request.project_id}"
                )
                return icon_response

            except RuntimeError as e:
                log.error(f"Service error: {e}")
                raise HTTPException(status_code=500, detail=str(e))
            except Exception as e:
                log.error(f"Unexpected error: {e}")
                raise HTTPException(
                    status_code=500, detail="An unexpected error occurred"
                )
