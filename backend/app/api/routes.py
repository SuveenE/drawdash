import logging

from fastapi import APIRouter

from app.controllers.image import ImageController
from app.controllers.project import ProjectController
from app.services.image import ImageService
from app.services.project import ProjectService

log = logging.getLogger(__name__)

router = APIRouter()

### Health check


@router.get("/status")
async def status():
    log.info("Status endpoint called")
    return {"status": "ok"}


### Projects


def get_project_controller_router():
    service = ProjectService()
    return ProjectController(service=service).router


router.include_router(
    get_project_controller_router(),
    tags=["projects"],
    prefix="/api/projects",
)


### Image Generation


def get_image_controller_router():
    service = ImageService()
    return ImageController(service=service).router


router.include_router(
    get_image_controller_router(),
    tags=["image"],
    prefix="/api/generate-image",
)
