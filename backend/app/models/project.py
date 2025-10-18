from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Project(BaseModel):
    id: str = Field(description="The unique identifier for the project.")
    user_id: str = Field(description="The user ID who owns the project.")
    name: Optional[str] = Field(default=None, description="The name of the project.")
    description: Optional[str] = Field(
        default=None, description="The description of the project."
    )
    snapshot: Optional[Dict[str, Any]] = Field(
        default=None, description="The snapshot data for the project."
    )
    created_at: datetime = Field(description="The timestamp when the project was created.")
    updated_at: datetime = Field(description="The timestamp when the project was last updated.")


class ProjectListResponse(BaseModel):
    projects: List[Project] = Field(description="List of projects for the user.")

