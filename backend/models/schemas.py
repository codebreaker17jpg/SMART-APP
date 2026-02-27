from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from typing import Optional


# ── Enums ─────────────────────────────────────────────────────────────

class AttendanceStatus(str, Enum):
    present = "present"
    absent = "absent"
    late = "late"


class TopicStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


# ── Student ───────────────────────────────────────────────────────────

class StudentBase(BaseModel):
    name: str
    roll_number: Optional[str] = None
    subject_major: Optional[str] = None


class Student(StudentBase):
    """Full student record as returned from Supabase."""
    id: str
    face_descriptor: Optional[list[float]] = None
    created_at: datetime


# ── Subject ───────────────────────────────────────────────────────────

class SubjectBase(BaseModel):
    name: str
    code: str
    department: str
    semester: int
    teacher_id: str
    total_classes: int = 0


class Subject(SubjectBase):
    id: str
    created_at: datetime


# ── Attendance ────────────────────────────────────────────────────────

class AttendanceRecordBase(BaseModel):
    student_id: str
    subject_id: str
    class_date: str
    status: AttendanceStatus = AttendanceStatus.present
    marked_by: str


class AttendanceRecord(AttendanceRecordBase):
    id: str
    marked_at: Optional[datetime] = None
    created_at: datetime


class AttendanceScanRequest(BaseModel):
    """Payload for the POST /attendance/scan endpoint."""
    student_id: str = Field(..., description="UUID of the scanning student")
    session_id: str = Field(..., description="UUID of the active live session")


class AttendanceScanResponse(BaseModel):
    success: bool
    message: str
    attendance_id: Optional[str] = None


# ── Curriculum ────────────────────────────────────────────────────────

class CurriculumTopicBase(BaseModel):
    subject_id: str
    title: str
    description: str
    order_number: int
    estimated_hours: float
    status: TopicStatus = TopicStatus.pending


class CurriculumTopic(CurriculumTopicBase):
    id: str
    completed_at: Optional[datetime] = None
    created_at: datetime


class TopicStatusUpdate(BaseModel):
    """Payload for PATCH /curriculum/topics/{id}/status."""
    status: TopicStatus


# ── Generic ───────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str

class MessageResponse(BaseModel):
    message: str
