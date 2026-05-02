from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user, require_admin, require_admin_or_hr
from app.services.overtime import (
    submit_overtime_request,
    get_user_overtime_requests,
    get_all_overtime_requests,
    update_overtime_status,
)

router = APIRouter(prefix="/overtime", tags=["overtime"])


class OvertimeRequest(BaseModel):
    date: str
    hours: float
    reason: str


class OvertimeStatusUpdate(BaseModel):
    status: str


@router.post("/request")
async def create_request(req: OvertimeRequest, user: dict = Depends(get_current_user)):
    try:
        record = submit_overtime_request(user["user_id"], req.date, req.hours, req.reason)
        return {"record": record, "message": "Overtime request submitted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/my-requests")
async def my_requests(user: dict = Depends(get_current_user)):
    records = get_user_overtime_requests(user["user_id"])
    return {"records": records}


@router.get("/all")
async def all_requests(user: dict = Depends(require_admin_or_hr)):
    records = get_all_overtime_requests()
    return {"records": records}


@router.put("/{request_id}/status")
async def update_status(request_id: str, req: OvertimeStatusUpdate, user: dict = Depends(require_admin)):
    try:
        record = update_overtime_status(request_id, req.status)
        return {"record": record, "message": f"Overtime request {req.status}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
