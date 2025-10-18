from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ImagePair(BaseModel):
    id: str = Field(description="The unique identifier for the image pair.")
    project_id: str = Field(description="The project ID this image pair belongs to.")
    input_url: str = Field(description="URL to the input image.")
    input_mime_type: Optional[str] = Field(
        default=None, description="MIME type of the input image."
    )
    input_width: Optional[int] = Field(
        default=None, description="Width of the input image in pixels."
    )
    input_height: Optional[int] = Field(
        default=None, description="Height of the input image in pixels."
    )
    output_url: Optional[str] = Field(
        default=None, description="URL to the output image."
    )
    output_mime_type: Optional[str] = Field(
        default=None, description="MIME type of the output image."
    )
    output_width: Optional[int] = Field(
        default=None, description="Width of the output image in pixels."
    )
    output_height: Optional[int] = Field(
        default=None, description="Height of the output image in pixels."
    )
    prompt_text: Optional[str] = Field(
        default=None, description="The prompt text used to generate the output image."
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional metadata for the image pair."
    )
    created_at: datetime = Field(
        description="The timestamp when the image pair was created."
    )
    updated_at: datetime = Field(
        description="The timestamp when the image pair was last updated."
    )


class ImagePairListResponse(BaseModel):
    image_pairs: List[ImagePair] = Field(
        description="List of image pairs for the project."
    )

