from typing import Optional

from pydantic import BaseModel, Field


class MessageRequest(BaseModel):
    id: Optional[str] = Field(
        description="The ID of the chat history which this message belongs to. It is None if this is a new chat."
    )
    content: str = Field(
        description="The content of the user message to be sent to the assistant."
    )


class MessageResponse(BaseModel):
    id: str = Field(
        description="The ID of the chat history which this message belongs to. This should be passed back to the server during the next request."
    )
    content: str = Field(
        description="The response from the assistant to be sent back to the user."
    )
