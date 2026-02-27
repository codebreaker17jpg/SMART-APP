from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/ai", tags=["AI Features"])


@router.get("/status")
def ai_status():
    """Health-check for AI feature subsystem.

    This is a placeholder — expand with face-recognition,
    analytics, or recommendation endpoints as needed.
    """
    return {
        "status": "operational",
        "message": "AI features subsystem is ready.",
    }
