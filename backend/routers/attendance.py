from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from datetime import date

from core.database import get_supabase
from models.schemas import (
    Student,
    AttendanceScanRequest,
    AttendanceScanResponse,
)

router = APIRouter(prefix="/api/v1", tags=["Attendance"])


# ── GET /api/v1/students ──────────────────────────────────────────────

@router.get("/students", response_model=list[Student])
def get_all_students(db: Client = Depends(get_supabase)):
    """Fetch every row from the **students** table."""
    response = db.table("students").select("*").execute()
    return response.data


# ── POST /api/v1/attendance/scan ──────────────────────────────────────

@router.post("/attendance/scan", response_model=AttendanceScanResponse)
def scan_attendance(
    payload: AttendanceScanRequest,
    db: Client = Depends(get_supabase),
):
    """Validate a scan request and insert an attendance record.

    Steps:
    1. Verify the student exists.
    2. Verify the live session exists and is active.
    3. Check for duplicate attendance on the same day + subject.
    4. Insert a new row into **attendance_records**.
    """

    # 1 — Student exists?
    student_resp = (
        db.table("students")
        .select("id, name")
        .eq("id", payload.student_id)
        .single()
        .execute()
    )
    if not student_resp.data:
        raise HTTPException(status_code=404, detail="Student not found.")

    # 2 — Active live session?
    session_resp = (
        db.table("live_sessions")
        .select("*")
        .eq("id", payload.session_id)
        .eq("is_active", True)
        .single()
        .execute()
    )
    if not session_resp.data:
        raise HTTPException(
            status_code=404,
            detail="Live session not found or is no longer active.",
        )

    session = session_resp.data
    today = date.today().isoformat()

    # 3 — Duplicate check
    dup_resp = (
        db.table("attendance_records")
        .select("id")
        .eq("student_id", payload.student_id)
        .eq("subject_id", session["subject_id"])
        .eq("class_date", today)
        .execute()
    )
    if dup_resp.data:
        raise HTTPException(
            status_code=409,
            detail="Attendance already marked for this class today.",
        )

    # 4 — Insert attendance record
    insert_resp = (
        db.table("attendance_records")
        .insert(
            {
                "student_id": payload.student_id,
                "subject_id": session["subject_id"],
                "class_date": today,
                "status": "present",
                "marked_by": payload.student_id,
            }
        )
        .execute()
    )

    if not insert_resp.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to insert attendance record.",
        )

    return AttendanceScanResponse(
        success=True,
        message="Attendance marked successfully.",
        attendance_id=insert_resp.data[0]["id"],
    )
