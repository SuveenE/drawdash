import logging
from typing import Dict, List
from uuid import uuid4

import fal_client
from openai import OpenAI
from supabase._async.client import AsyncClient as Client

from app.models.project import (
    IconGenerationRequest,
    IconGenerationResponse,
    Project,
    ProjectCreateRequest,
    ProjectUpdateRequest,
)

log = logging.getLogger(__name__)


class ProjectService:
    async def get_project_by_id(
        self, supabase_client: Client, project_id: str
    ) -> Project:
        """
        Fetch a single project by ID.

        Args:
            supabase_client: The Supabase client instance
            project_id: The project ID to fetch

        Returns:
            Project object
        """
        log.info(f"Fetching project with id: {project_id}")

        try:
            # Query the projects table
            response = (
                await supabase_client.table("projects")
                .select("*")
                .eq("id", project_id)
                .single()
                .execute()
            )

            if not response.data:
                raise RuntimeError(f"Project not found: {project_id}")

            project = Project(**response.data)
            log.info(f"Found project: {project.id}")

            return project

        except Exception as e:
            log.error(f"Error fetching project {project_id}: {e}")
            raise RuntimeError(f"Failed to fetch project: {e}")

    async def check_if_first_image_generation(
        self, supabase_client: Client, project_id: str
    ) -> bool:
        """
        Check if this is the first image generation for a project.

        Args:
            supabase_client: The Supabase client instance
            project_id: The project ID to check

        Returns:
            True if this is the first image generation, False otherwise
        """
        log.info(f"Checking if first image generation for project: {project_id}")

        try:
            # Count the number of image pairs for this project
            response = (
                await supabase_client.table("image_pairs")
                .select("id", count="exact")
                .eq("project_id", project_id)
                .execute()
            )

            count = response.count if response.count is not None else 0
            is_first = count == 0
            log.info(
                f"Project {project_id} has {count} image pairs. Is first: {is_first}"
            )

            return is_first

        except Exception as e:
            log.error(f"Error checking image pairs for project {project_id}: {e}")
            raise RuntimeError(f"Failed to check image pairs: {e}")

    async def get_projects_by_user_id(
        self, supabase_client: Client, user_id: str
    ) -> List[Project]:
        """
        Fetch all projects for a given user ID.

        Args:
            supabase_client: The Supabase client instance
            user_id: The user ID to fetch projects for

        Returns:
            List of Project objects for the user
        """
        log.info(f"Fetching projects for user_id: {user_id}")

        try:
            # Query the projects table
            response = (
                await supabase_client.table("projects")
                .select("*")
                .eq("user_id", user_id)
                .order("updated_at", desc=True)
                .execute()
            )

            if not response.data:
                log.info(f"No projects found for user_id: {user_id}")
                return []

            # Convert to Project models
            projects = [Project(**project_data) for project_data in response.data]
            log.info(f"Found {len(projects)} projects for user_id: {user_id}")

            return projects

        except Exception as e:
            log.error(f"Error fetching projects for user_id {user_id}: {e}")
            raise RuntimeError(f"Failed to fetch projects: {e}")

    async def create_project(
        self, supabase_client: Client, project_data: ProjectCreateRequest
    ) -> Project:
        """
        Create a new project.

        Args:
            supabase_client: The Supabase client instance
            project_data: The project data to create

        Returns:
            Created Project object
        """
        log.info(f"Creating project for user_id: {project_data.user_id}")

        try:
            # Prepare project data with generated ID
            new_project = {
                "id": str(uuid4()),
                "user_id": project_data.user_id,
                "name": project_data.name,
                "description": project_data.description,
                "snapshot": project_data.snapshot,
            }

            # Insert into projects table
            response = (
                await supabase_client.table("projects").insert(new_project).execute()
            )

            if not response.data or len(response.data) == 0:
                raise RuntimeError("Failed to create project: No data returned")

            project = Project(**response.data[0])
            log.info(f"Successfully created project with id: {project.id}")

            return project

        except Exception as e:
            log.error(f"Error creating project: {e}")
            raise RuntimeError(f"Failed to create project: {e}")

    async def update_project(
        self,
        supabase_client: Client,
        project_id: str,
        user_id: str,
        project_data: ProjectUpdateRequest,
    ) -> Project:
        """
        Update an existing project.

        Args:
            supabase_client: The Supabase client instance
            project_id: The ID of the project to update
            user_id: The user ID who owns the project (for authorization)
            project_data: The project data to update

        Returns:
            Updated Project object
        """
        log.info(f"Updating project {project_id} for user_id: {user_id}")

        try:
            # Prepare update data (only include non-None fields)
            update_data: Dict = {}
            if project_data.name is not None:
                update_data["name"] = project_data.name
            if project_data.description is not None:
                update_data["description"] = project_data.description
            if project_data.snapshot is not None:
                update_data["snapshot"] = project_data.snapshot
            if project_data.icon_url is not None:
                update_data["icon_url"] = project_data.icon_url

            if not update_data:
                raise RuntimeError("No fields to update")

            # Update the project (with user_id check for authorization)
            response = (
                await supabase_client.table("projects")
                .update(update_data)
                .eq("id", project_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not response.data or len(response.data) == 0:
                raise RuntimeError(
                    "Failed to update project: Project not found or unauthorized"
                )

            project = Project(**response.data[0])
            log.info(f"Successfully updated project with id: {project.id}")

            return project

        except Exception as e:
            log.error(f"Error updating project {project_id}: {e}")
            raise RuntimeError(f"Failed to update project: {e}")

    async def generate_3d_icon(
        self, supabase_client: Client, request: IconGenerationRequest
    ) -> IconGenerationResponse:
        """
        Generate a 3D icon using Fal AI and a topic description, then save both to the database.

        Args:
            supabase_client: The Supabase client instance
            request: The icon generation request containing prompt, project_id, user_id, and style

        Returns:
            IconGenerationResponse containing the generated icon URL, description, and optional image data
        """
        log.info(f"Generating 3D icon and description for project: {request.project_id}")

        try:
            # Construct the full prompt with style modifiers
            full_prompt = f"The following is a text prompt or a conversation about a 2 or 3 word topic: {request.prompt}, Draw a 3D icon png with the following style: {request.style}. Also make sure you don't include text in the image."

            # Define callback to log queue updates
            def on_queue_update(update):
                if isinstance(update, fal_client.InProgress):
                    for log_entry in update.logs:
                        log.info(f"Fal AI: {log_entry['message']}")

            # Call Fal AI to generate the icon using the queue system
            # Using FLUX Pro for high-quality 3D icon generation
            result = fal_client.subscribe(
                "fal-ai/nano-banana",
                arguments={
                    "prompt": full_prompt,
                },
                with_logs=True,
                on_queue_update=on_queue_update,
            )

            # Validate response
            if not result or "images" not in result or len(result["images"]) == 0:
                log.error(f"Invalid response from Fal AI: {result}")
                raise RuntimeError("No image generated by Fal AI")

            # Extract the image URL from the response
            image_url = result["images"][0]["url"]
            log.info(f"Successfully generated 3D icon: {image_url}")

            # Generate topic description
            log.info(f"Generating topic description for project: {request.project_id}")
            topic_description = await self.generate_topic_description(
                supabase_client=supabase_client, project_id=request.project_id
            )
            log.info(f"Successfully generated topic description: {topic_description}")

            # Update the project with both icon URL and description
            log.info(f"Updating project {request.project_id} with icon and description")
            update_data = {
                "icon_url": image_url,
                "description": topic_description,
            }

            response = (
                await supabase_client.table("projects")
                .update(update_data)
                .eq("id", request.project_id)
                .eq("user_id", request.user_id)
                .execute()
            )

            if not response.data or len(response.data) == 0:
                log.error(f"Failed to update project {request.project_id}")
                raise RuntimeError(
                    "Failed to update project: Project not found or unauthorized"
                )

            log.info(f"Successfully updated project {request.project_id} with icon and description")

            return IconGenerationResponse(
                image_url=image_url,
                description=topic_description,
                image_data=None,  # Optionally, we could download and encode to base64
            )

        except Exception as e:
            log.error(f"Error generating 3D icon and description: {e}")
            raise RuntimeError(f"Failed to generate 3D icon and description: {e}")

    async def generate_topic_description(
        self, supabase_client: Client, project_id: str
    ) -> str:
        """
        Generate a concise few-words description about the topic being discussed in the project.
        
        Analyzes the project name, description, and associated content to create a short
        topic description (typically 2-5 words).

        Args:
            supabase_client: The Supabase client instance
            project_id: The ID of the project to analyze

        Returns:
            A concise string description of the project topic (few words)
        """
        log.info(f"Generating topic description for project: {project_id}")

        try:
            # Fetch the project details
            project = await self.get_project_by_id(supabase_client, project_id)

            # Fetch image pairs associated with the project to understand context
            response = (
                await supabase_client.table("image_pairs")
                .select("prompt, before_description, after_description")
                .eq("project_id", project_id)
                .limit(5)
                .order("created_at", desc=True)
                .execute()
            )

            image_pairs = response.data if response.data else []

            # Build context for AI analysis
            context_parts = []
            if project.name:
                context_parts.append(f"Project Name: {project.name}")
            if project.description:
                context_parts.append(f"Project Description: {project.description}")
            
            if image_pairs:
                context_parts.append("\nRecent prompts and descriptions:")
                for idx, pair in enumerate(image_pairs[:3], 1):
                    if pair.get("prompt"):
                        context_parts.append(f"{idx}. Prompt: {pair['prompt']}")
                    if pair.get("before_description"):
                        context_parts.append(f"   Before: {pair['before_description']}")
                    if pair.get("after_description"):
                        context_parts.append(f"   After: {pair['after_description']}")

            context = "\n".join(context_parts)

            if not context.strip():
                log.warning(f"No context available for project {project_id}")
                return "Untitled Project"

            # Use OpenAI to generate a concise topic description
            client = OpenAI()
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=50,
                messages=[
                    {
                        "role": "user",
                        "content": f"""Based on the following project information, generate a very concise topic description in 2-5 words that captures the essence of what this project is about.

{context}

Respond with ONLY the 3 to 6 words short topic description, nothing else. 
Your response (3-6 words only):"""
                    }
                ],
            )

            # Extract the topic description from the response
            topic_description = response.choices[0].message.content.strip()
            
            # Remove any quotes if present
            topic_description = topic_description.strip('"').strip("'")
            
            log.info(f"Generated topic description for project {project_id}: {topic_description}")
            
            return topic_description

        except Exception as e:
            log.error(f"Error generating topic description for project {project_id}: {e}")
            # Return a fallback instead of raising an error
            return "Project Topic"
