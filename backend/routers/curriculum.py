from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from typing import Optional
from datetime import datetime

from core.database import get_supabase
from models.schemas import CurriculumTopic, TopicStatusUpdate

router = APIRouter(prefix="/api/v1/curriculum", tags=["Curriculum"])


# ── GET /api/v1/curriculum/topics ─────────────────────────────────────

@router.get("/topics", response_model=list[CurriculumTopic])
def get_topics(
    subject_id: Optional[str] = Query(None, description="Filter by subject UUID"),
    db: Client = Depends(get_supabase),
):
    """Fetch curriculum topics, optionally filtered by subject."""
    query = db.table("curriculum_topics").select("*")

    if subject_id:
        query = query.eq("subject_id", subject_id)

    query = query.order("order_number")
    response = query.execute()
    return response.data


# ── PATCH /api/v1/curriculum/topics/{topic_id}/status ─────────────────

@router.patch("/topics/{topic_id}/status", response_model=CurriculumTopic)
def update_topic_status(
    topic_id: str,
    payload: TopicStatusUpdate,
    db: Client = Depends(get_supabase),
):
    """Update the status of a single curriculum topic."""

    update_data: dict = {"status": payload.status.value}

    if payload.status == "completed":
        update_data["completed_at"] = datetime.utcnow().isoformat()

    response = (
        db.table("curriculum_topics")
        .update(update_data)
        .eq("id", topic_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Topic not found.")

    return response.data[0]
