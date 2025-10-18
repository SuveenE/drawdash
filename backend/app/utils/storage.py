import base64
import logging
import uuid
from io import BytesIO
from typing import Tuple

from PIL import Image
from supabase._async.client import AsyncClient as Client

log = logging.getLogger(__name__)


async def upload_image_to_storage(
    supabase_client: Client,
    image_data: str,
    bucket_name: str = "whisprdraw",
    folder: str = "image_pairs",
) -> Tuple[str, str, int, int]:
    """
    Upload a base64 encoded image to Supabase storage.

    Args:
        supabase_client: The Supabase client instance
        image_data: Base64 encoded image data
        bucket_name: The name of the storage bucket
        folder: The folder path within the bucket

    Returns:
        Tuple of (public_url, mime_type, width, height)
    """
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))

        # Get image properties
        width, height = image.size
        mime_type = f"image/{image.format.lower()}" if image.format else "image/png"

        # Generate unique filename
        file_extension = image.format.lower() if image.format else "png"
        filename = f"{folder}/{uuid.uuid4()}.{file_extension}"

        # Upload to Supabase storage
        response = await supabase_client.storage.from_(bucket_name).upload(
            path=filename,
            file=image_bytes,
            file_options={"content-type": mime_type},
        )

        # Get public URL
        public_url_response = await supabase_client.storage.from_(bucket_name).get_public_url(
            filename
        )

        log.info(f"Successfully uploaded image to {public_url_response}")
        return public_url_response, mime_type, width, height

    except Exception as e:
        log.error(f"Error uploading image to storage: {e}")
        raise RuntimeError(f"Failed to upload image: {e}")


async def save_image_pair_to_db(
    supabase_client: Client,
    project_id: str,
    input_url: str,
    input_mime_type: str,
    input_width: int,
    input_height: int,
    output_url: str,
    output_mime_type: str,
    output_width: int,
    output_height: int,
    prompt_text: str,
    metadata: dict = None,
):
    """
    Save an image pair record to the database.

    Args:
        supabase_client: The Supabase client instance
        project_id: The project ID
        input_url: URL to the input image
        input_mime_type: MIME type of the input image
        input_width: Width of the input image
        input_height: Height of the input image
        output_url: URL to the output/generated image
        output_mime_type: MIME type of the output image
        output_width: Width of the output image
        output_height: Height of the output image
        prompt_text: The prompt used for generation
        metadata: Optional metadata dictionary
    """
    try:
        data = {
            "project_id": project_id,
            "input_url": input_url,
            "input_mime_type": input_mime_type,
            "input_width": input_width,
            "input_height": input_height,
            "output_url": output_url,
            "output_mime_type": output_mime_type,
            "output_width": output_width,
            "output_height": output_height,
            "prompt_text": prompt_text,
            "metadata": metadata,
        }

        response = await supabase_client.table("image_pairs").insert(data).execute()

        log.info(f"Successfully saved image pair to database: {response.data}")
        return response.data

    except Exception as e:
        log.error(f"Error saving image pair to database: {e}")
        raise RuntimeError(f"Failed to save image pair: {e}")

