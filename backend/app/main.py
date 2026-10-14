from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
import uuid

from app.config import settings
from app.routers import health, brands, assets, scans, findings, sources, evaluation, demo

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("brandguard.api")

app = FastAPI(
    title="BrandGuard — Digital Identity Protection Platform API",
    description="Enterprise Digital Risk Protection (DRP) against brand impersonation, deceptive apps, and rogue social profiles.",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_and_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response


# Exception Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please consult the system administrator.",
            "path": request.url.path
        }
    )


# Mount routers with /api/v1 prefix
app.include_router(health.router, prefix="/api/v1")
app.include_router(brands.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")
app.include_router(sources.router, prefix="/api/v1")
app.include_router(scans.router, prefix="/api/v1")
app.include_router(findings.router, prefix="/api/v1")
app.include_router(evaluation.router, prefix="/api/v1")
app.include_router(demo.router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "service": "BrandGuard Digital Risk Protection Platform API",
        "version": settings.app_version,
        "docs": "/docs",
        "api_v1_base": "/api/v1"
    }
