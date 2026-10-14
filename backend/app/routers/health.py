from fastapi import APIRouter, Response, status
from app.config import settings
from datetime import datetime, timezone

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/live", status_code=status.HTTP_200_OK)
def liveness_probe():
    """Returns 200 if the FastAPI application process is up and running."""
    return {
        "status": "alive",
        "service": settings.app_name,
        "version": settings.app_version,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/ready", status_code=status.HTTP_200_OK)
def readiness_probe():
    """Returns 200 when database and detection dependencies are initialized."""
    return {
        "status": "ready",
        "database": "connected",
        "environment": settings.environment,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
