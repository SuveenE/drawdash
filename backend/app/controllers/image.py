import logging

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException

from app.models.image import ImageGenerationRequest, ImageGenerationResponse
from app.services.image import ImageService
from app.utils.database import db_client
from app.utils.storage import save_image_pair_to_db, upload_image_to_storage

log = logging.getLogger(__name__)


async def save_images_to_database(
    authorization: str,
    project_id: str,
    input_image_data: str,
    output_image_data: str,
    prompt_text: str,
):
    """
    Background task to upload images to storage and save the pair to database.
    """
    try:
        log.info(f"Starting background task to save images for project {project_id}")

        # Skip if no input image data (required for image pairs)
        if not input_image_data:
            log.warning("No input image data provided, skipping database save")
            return

        # Extract token from authorization header
        token = authorization.replace("Bearer ", "") if authorization else ""

        # Get database client
        supabase_client = await db_client(token=token)

        # Upload input image to storage
        input_url, input_mime_type, input_width, input_height = (
            await upload_image_to_storage(
                supabase_client=supabase_client,
                image_data=input_image_data,
                folder="image_pairs/input",
            )
        )

        # Upload output image to storage
        output_url, output_mime_type, output_width, output_height = (
            await upload_image_to_storage(
                supabase_client=supabase_client,
                image_data=output_image_data,
                folder="image_pairs/output",
            )
        )

        # Save image pair to database
        await save_image_pair_to_db(
            supabase_client=supabase_client,
            project_id=project_id,
            input_url=input_url,
            input_mime_type=input_mime_type,
            input_width=input_width,
            input_height=input_height,
            output_url=output_url,
            output_mime_type=output_mime_type,
            output_width=output_width,
            output_height=output_height,
            prompt_text=prompt_text,
        )

        log.info(f"Successfully saved image pair for project {project_id}")

    except Exception as e:
        log.error(f"Error in background task save_images_to_database: {e}")
        # Don't raise - background tasks should not affect the response


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
        async def generate_image(
            input: ImageGenerationRequest,
            background_tasks: BackgroundTasks,
            authorization: str = Header(None),
        ) -> ImageGenerationResponse:
            log.info(f"Generating image with prompt: {input.prompt}")
            log.info(f"Request type: {input.type}")
            log.info(f"Input image data present: {bool(input.image_data)}")
            if input.image_data:
                log.info(f"Input image data length: {len(input.image_data)}")

            try:
                response: ImageGenerationResponse = await self.service.generate_image(
                    input=input
                )
                log.info("Image generation completed successfully")

                # Add background task to save images to database
                background_tasks.add_task(
                    save_images_to_database,
                    authorization=authorization,
                    project_id=input.project_id,
                    input_image_data=input.image_data,
                    output_image_data=response.image_data,
                    prompt_text=input.prompt,
                )

                return response
            except ValueError as e:
                log.error(f"Validation error: {e}")
                raise HTTPException(status_code=400, detail=str(e))
            except RuntimeError as e:
                log.error(f"Service error: {e}")
                raise HTTPException(status_code=500, detail=str(e))
            except Exception as e:
                log.error(f"Unexpected error: {e}")
                raise HTTPException(
                    status_code=500, detail="An unexpected error occurred"
                )
