from typing import Optional

from pydantic import BaseModel, Field


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(description="The text prompt describing the image to generate.")
    image_data: Optional[str] = Field(
        default=None,
        description="Optional base64 encoded image data to use as input for image generation.",
    )


class ImageGenerationResponse(BaseModel):
    image_data: str = Field(description="Base64 encoded generated image data.")
    text_response: Optional[str] = Field(
        default=None, description="Any text response from the model."
    )
