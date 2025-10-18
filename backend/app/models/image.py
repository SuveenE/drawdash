from typing import Literal, Optional

from pydantic import BaseModel, Field


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(description="The text prompt describing the image to generate.")
    image_data: Optional[str] = Field(
        default=None,
        description="Optional base64 encoded image data to use as input for image generation.",
    )
    project_id: Optional[str] = Field(
        default=None,
        description="Optional project ID to associate with this image pair. Required when save_data is True.",
    )
    type: Literal["generate", "edit"] = Field(
        default="generate",
        description="The type of operation: 'generate' for new images or 'edit' for modifying existing images.",
    )
    save_data: bool = Field(
        default=True,
        description="Whether to save the generated images to database and generate project icon. Default is True.",
    )


class ImageGenerationResponse(BaseModel):
    image_data: str = Field(description="Base64 encoded generated image data.")
    text_response: Optional[str] = Field(
        default=None, description="Any text response from the model."
    )
