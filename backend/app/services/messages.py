import logging

from app.models.messages import MessageRequest, MessageResponse

log = logging.getLogger(__name__)


class MessagesService:
    async def chat(self, input: MessageRequest) -> MessageResponse:
        return MessageResponse(id="123", content=f"Why did you say {input.content}?")
