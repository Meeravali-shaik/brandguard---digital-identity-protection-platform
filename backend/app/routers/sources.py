from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/sources", tags=["Sources"])

AVAILABLE_SOURCES = [
    {
        "id": "synthetic_demo_source",
        "name": "Synthetic Identity Benchmark Feed",
        "integration_type": "Simulated Demo Source",
        "provenance": "Local Deterministic Benchmark Engine",
        "status": "operational",
        "last_sync": "Continuous",
        "candidate_count": 10,
        "is_live_external": False,
        "notes": "Verified offline synthetic benchmark covering homoglyphs, exact clones, and exclusion edge cases."
    },
    {
        "id": "csv_importer",
        "name": "Enterprise CSV/JSON Snapshot Ingestion",
        "integration_type": "Imported Dataset",
        "provenance": "Security Operations Center Batch Upload",
        "status": "ready",
        "last_sync": "On-demand",
        "candidate_count": 0,
        "is_live_external": False,
        "notes": "Accepts customer external discovery dumps and threat intelligence exports."
    },
    {
        "id": "itunes_search_api",
        "name": "Apple iTunes Store Search API",
        "integration_type": "Live API Integration",
        "provenance": "https://itunes.apple.com/search",
        "status": "available",
        "last_sync": "Live on Scan Trigger",
        "candidate_count": 0,
        "is_live_external": True,
        "notes": "Queries Apple public store search for registered app names without scraping."
    }
]


@router.get("", response_model=List[Dict[str, Any]])
def list_sources():
    """Retrieve all configured data intake sources with transparent provenance."""
    return AVAILABLE_SOURCES


@router.get("/status")
def get_sources_status():
    """Returns active connectivity health for intake channels."""
    return {
        "active_sources": len(AVAILABLE_SOURCES),
        "live_integrations_enabled": 1,
        "synthetic_sources": 1,
        "imported_sources": 1
    }
