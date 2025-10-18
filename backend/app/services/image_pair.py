import logging
from typing import List

from supabase._async.client import AsyncClient as Client

from app.models.image_pair import ImagePair

log = logging.getLogger(__name__)


class ImagePairService:
    async def get_image_pairs_by_project_id(
        self, supabase_client: Client, project_id: str
    ) -> List[ImagePair]:
        """
        Fetch all image pairs for a given project ID.

        Args:
            supabase_client: The Supabase client instance
            project_id: The project ID to fetch image pairs for

        Returns:
            List of ImagePair objects for the project
        """
        log.info(f"Fetching image pairs for project_id: {project_id}")

        try:
            # Query the image_pairs table (uses the project_id index)
            response = (
                await supabase_client.table("image_pairs")
                .select("*")
                .eq("project_id", project_id)
                .order("created_at", desc=True)
                .execute()
            )

            if not response.data:
                log.info(f"No image pairs found for project_id: {project_id}")
                return []

            # Convert to ImagePair models
            image_pairs = [ImagePair(**pair_data) for pair_data in response.data]
            log.info(f"Found {len(image_pairs)} image pairs for project_id: {project_id}")

            return image_pairs

        except Exception as e:
            log.error(f"Error fetching image pairs for project_id {project_id}: {e}")
            raise RuntimeError(f"Failed to fetch image pairs: {e}")

