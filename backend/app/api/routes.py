import logging

from fastapi import APIRouter

from app.controllers.image import ImageController
from app.controllers.messages import MessagesController
from app.services.image import ImageService
from app.services.messages import MessagesService

log = logging.getLogger(__name__)

router = APIRouter()

### Health check


@router.get("/status")
async def status():
    log.info("Status endpoint called")
    return {"status": "ok"}


### Messages


def get_messages_controller_router():
    service = MessagesService()
    return MessagesController(service=service).router


router.include_router(
    get_messages_controller_router(),
    tags=["messages"],
    prefix="/api/messages",
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
