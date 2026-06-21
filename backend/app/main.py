from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from app.core.config import settings
from app.routers.auth import router as auth_router
from app.routers.companies import router as companies_router

from contextlib import asynccontextmanager
from app.core.http_client import init_http_client, close_http_client
from app.core.redis import init_redis_client, close_redis_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize global connection pools
    await init_http_client()
    await init_redis_client()
    yield
    # Shutdown: Close global connection pools cleanly
    await close_http_client()
    await close_redis_client()

app = FastAPI(
    title="CompassLabs Backend",
    description="AI powered platform for company research and analysis",
    version="1.0.0",
    lifespan=lifespan,
    swagger_ui_parameters={
        "persistAuthorization": True,
        "tryItOutEnabled": True,
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(companies_router)


@app.get("/")
def root():
    return {"message": "CompassLabs Backend is running!"}


@app.get("/health")
def health():
    return {"status": "ok"}


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="CompassLabs Backend",
        version="1.0.0",
        description="AI powered platform for company research and analysis",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Paste your access_token from POST /auth/dev/tokens",
        }
    }

    for path in openapi_schema["paths"].values():
        for operation in path.values():
            operation["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi
