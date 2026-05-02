from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from app.auth import require_admin, require_admin_or_hr
from app.services.admin import get_all_employees, get_all_attendance, get_attendance_csv

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/employees")
async def list_employees(user: dict = Depends(require_admin_or_hr)):
    employees = get_all_employees()
    return {"employees": employees}


@router.get("/attendance")
async def admin_attendance(
    date_from: str | None = None,
    date_to: str | None = None,
    search: str | None = None,
    user: dict = Depends(require_admin_or_hr),
):
    records = get_all_attendance(date_from, date_to, search)
    return {"records": records}


@router.get("/attendance/csv")
async def attendance_csv(
    date_from: str | None = None,
    date_to: str | None = None,
    user: dict = Depends(require_admin_or_hr),
):
    csv_data = get_attendance_csv(date_from, date_to)
    return PlainTextResponse(content=csv_data, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=attendance.csv"
    })
