import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(name)s - %(message)s",
)
logging.getLogger("httpx").setLevel(logging.WARNING)
log = logging.getLogger(__name__)
log.addHandler(logging.StreamHandler())


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Entry point lifecycle event. Runs before the server starts"""
    try:
        log.info("Starting up server...")
        yield
    except Exception as e:
        log.exception("Failed to initialize Raise and Rage server: %s", e)
        raise e
    finally:
        log.info("Shutting down server...")


def create_app() -> FastAPI:
    """Create FastAPI app with all routes."""
    try:
        app = FastAPI(lifespan=lifespan, debug=True)

        # TODO: This is a quick fix to bypass CORS error. We need to ensure that the origin is shared in production / whitelist specific origins explicitly.
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        app.include_router(router)

        @app.exception_handler(RequestValidationError)
        async def validation_exception_handler(request, exc: RequestValidationError):
            exc_str = f"{exc}".replace("\n", " ").replace("   ", " ")
            log.error(f"{request}: {exc_str}")

            content = {"status_code": 10422, "message": exc_str, "data": None}
            return JSONResponse(
                content=content, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        return app
    except Exception as e:
        log.exception("Failed to create backend server: %s", e)
        raise e


app = create_app()
