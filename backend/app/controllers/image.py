import logging

from fastapi import APIRouter, HTTPException

from app.models.image import ImageGenerationRequest, ImageGenerationResponse
from app.services.image import ImageService

log = logging.getLogger(__name__)


class ImageController:
    def __init__(self, service: ImageService):
        self.router = APIRouter()
        self.service = service
        self.setup_routes()

    def setup_routes(self):
        router = self.router

        @router.post(
            "",
            response_model=ImageGenerationResponse,
        )
        async def generate_image(input: ImageGenerationRequest) -> ImageGenerationResponse:
            log.info(f"Generating image with prompt: {input.prompt}")
            try:
                response: ImageGenerationResponse = await self.service.generate_image(input=input)
                log.info("Image generation completed successfully")
                return response
            except ValueError as e:
                log.error(f"Validation error: {e}")
                raise HTTPException(status_code=400, detail=str(e))
            except RuntimeError as e:
                log.error(f"Service error: {e}")
                raise HTTPException(status_code=500, detail=str(e))
            except Exception as e:
                log.error(f"Unexpected error: {e}")
                raise HTTPException(status_code=500, detail="An unexpected error occurred")

