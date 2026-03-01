import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from supabase import Client

from core.database import get_admin_supabase
from models.schemas import (
    UserCreateRequest,
    UserCreateResponse,
    UserRole,
    BulkUploadResult,
    BulkUploadResponse,
)

router = APIRouter(prefix="/api/v1/admin", tags=["Admin – User Management"])


# ── Helpers ───────────────────────────────────────────────────────────

def _create_single_user(payload: UserCreateRequest, db: Client) -> UserCreateResponse:
    """Shared logic for creating one user (auth + public table)."""

    # 1 — Create Auth user via Supabase Admin API
    try:
        auth_response = db.auth.admin.create_user(
            {
                "email": payload.email,
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {
                    "name": payload.name,
                    "role": payload.role.value,
                },
            }
        )
    except Exception as e:
        error_msg = str(e)
        if "already been registered" in error_msg or "already exists" in error_msg:
            return UserCreateResponse(
                success=False,
                message=f"User with email {payload.email} already exists.",
            )
        return UserCreateResponse(success=False, message=f"Auth error: {error_msg}")

    user_id = auth_response.user.id

    # 2 — Insert into the correct public table
    try:
        if payload.role == UserRole.student:
            db.table("students").insert(
                {
                    "id": user_id,
                    "name": payload.name,
                    "roll_number": payload.roll_number or "",
                    "subject_major": payload.subject_major or "",
                }
            ).execute()
        else:
            db.table("faculties").insert(
                {
                    "id": user_id,
                    "name": payload.name,
                    "department": payload.department or "",
                    "email": payload.email,
                }
            ).execute()

    except Exception as e:
        # Auth user was created but table insert failed — clean up
        try:
            db.auth.admin.delete_user(user_id)
        except Exception:
            pass
        return UserCreateResponse(
            success=False,
            message=f"Auth user created but table insert failed: {e}. Auth user rolled back.",
        )

    return UserCreateResponse(
        success=True,
        message=f"{payload.role.value.capitalize()} '{payload.name}' created successfully.",
        user_id=user_id,
    )


# ── POST /api/v1/admin/users/create ──────────────────────────────────

@router.post("/users/create", response_model=UserCreateResponse)
def create_user(
    payload: UserCreateRequest,
    db: Client = Depends(get_admin_supabase),
):
    """Create a single Supabase Auth user and insert into the public table."""
    result = _create_single_user(payload, db)
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    return result


# ── POST /api/v1/admin/users/bulk ────────────────────────────────────

@router.post("/users/bulk", response_model=BulkUploadResponse)
async def bulk_create_users(
    role: UserRole = Query(..., description="Role for all users in the CSV"),
    file: UploadFile = File(..., description="CSV file with user data"),
    db: Client = Depends(get_admin_supabase),
):
    """Bulk-create users from a CSV file.

    **CSV format for students:**
    ```
    name,email,password,roll_number,subject_major
    ```

    **CSV format for teachers:**
    ```
    name,email,password,department
    ```
    """

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    contents = await file.read()
    text = contents.decode("utf-8-sig")  # handles BOM from Excel
    reader = csv.DictReader(io.StringIO(text))

    results: list[BulkUploadResult] = []
    succeeded = 0
    failed = 0

    for idx, row in enumerate(reader, start=1):
        name = row.get("name", "").strip()
        email = row.get("email", "").strip()
        password = row.get("password", "").strip()

        if not name or not email or not password:
            results.append(
                BulkUploadResult(
                    row=idx, email=email or "(empty)",
                    success=False, message="Missing required field (name/email/password).",
                )
            )
            failed += 1
            continue

        payload = UserCreateRequest(
            email=email,
            password=password,
            role=role,
            name=name,
            roll_number=row.get("roll_number", "").strip() if role == UserRole.student else None,
            subject_major=row.get("subject_major", "").strip() if role == UserRole.student else None,
            department=row.get("department", "").strip() if role == UserRole.teacher else None,
        )

        result = _create_single_user(payload, db)
        results.append(
            BulkUploadResult(row=idx, email=email, success=result.success, message=result.message)
        )
        if result.success:
            succeeded += 1
        else:
            failed += 1

    return BulkUploadResponse(
        total=succeeded + failed,
        succeeded=succeeded,
        failed=failed,
        results=results,
    )
