import logging
import os
import uuid

from supabase import AsyncClientOptions

# from supabase import AsyncClientOptions
from supabase._async.client import AsyncClient as Client
from supabase._async.client import create_client

# Import config to ensure environment variables are loaded

log = logging.getLogger(__name__)


def is_valid_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False


def _get_required_env_var(var_name: str) -> str:
    """Get a required environment variable with proper error handling."""
    value = os.environ.get(var_name)
    if not value:
        raise ValueError(
            f"Required environment variable '{var_name}' is not set or is empty"
        )
    return value


async def db_client(
    token: str,
) -> Client:
    try:
        supabase_url = _get_required_env_var("SUPABASE_URL")
        supabase_key = _get_required_env_var("SUPABASE_KEY")
    except ValueError as e:
        log.error(f"Failed to load required environment variables: {e}")
        raise

    """
    Note that if we set ADMIN_ACCESS to true, there won't be an org_id associated with the db request, which might be a cause of problem when the entry requires org_id to be non-null.
    """

    # Development
    if os.environ.get("ADMIN_ACCESS") == "true":
        return await create_client(
            supabase_url=supabase_url,
            supabase_key=supabase_key,
        )

    # Production
    return await create_client(
        supabase_url=supabase_url,
        supabase_key=supabase_key,
        options=AsyncClientOptions(
            headers={
                "Authorization": f"Bearer {token}",
                "apiKey": supabase_key,
            }
        ),
    )
