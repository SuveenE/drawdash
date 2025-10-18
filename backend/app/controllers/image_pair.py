import logging

from fastapi import APIRouter, Header, HTTPException

from app.models.image_pair import ImagePairListResponse
from app.services.image_pair import ImagePairService
from app.utils.database import db_client

log = logging.getLogger(__name__)


class ImagePairController:
    def __init__(self, service: ImagePairService):
        self.router = APIRouter()
        self.service = service
        self.setup_routes()

    def setup_routes(self):
        router = self.router

        @router.get(
            "/{project_id}",
            response_model=ImagePairListResponse,
        )
        async def get_image_pairs(
            project_id: str,
            authorization: str = Header(None),
        ) -> ImagePairListResponse:
            """
            Fetch all image pairs for a given project ID.
            """
            log.info(f"Fetching image pairs for project_id: {project_id}")
            try:
                # Extract token from authorization header
                token = authorization.replace("Bearer ", "") if authorization else ""

                # Get database client
                supabase_client = await db_client(token=token)

                # Fetch image pairs
                image_pairs = await self.service.get_image_pairs_by_project_id(
                    supabase_client=supabase_client, project_id=project_id
                )

                log.info(f"Successfully retrieved {len(image_pairs)} image pairs")
                return ImagePairListResponse(image_pairs=image_pairs)

            except RuntimeError as e:
                log.error(f"Service error: {e}")
                raise HTTPException(status_code=500, detail=str(e))
            except Exception as e:
                log.error(f"Unexpected error: {e}")
                raise HTTPException(
                    status_code=500, detail="An unexpected error occurred"
                )

