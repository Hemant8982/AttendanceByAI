from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth import get_current_user
from app.services.attendance import punch_in, punch_out, get_week_attendance, get_attendance_stats, get_today_record

router = APIRouter(prefix="/attendance", tags=["attendance"])


class PunchRequest(BaseModel):
    lat: float = 0
    lng: float = 0


@router.get("/today")
async def today_status(user: dict = Depends(get_current_user)):
    from datetime import date
    record = get_today_record(user["user_id"], date.today())
    return {"record": record}


@router.post("/punch-in")
async def do_punch_in(req: PunchRequest, user: dict = Depends(get_current_user)):
    try:
        record = punch_in(user["user_id"], req.lat, req.lng)
        return {"record": record, "message": "Punched in successfully"}
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/punch-out")
async def do_punch_out(req: PunchRequest, user: dict = Depends(get_current_user)):
    try:
        record = punch_out(user["user_id"], req.lat, req.lng)
        return {"record": record, "message": "Punched out successfully"}
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/week")
async def week_attendance(user: dict = Depends(get_current_user)):
    records = get_week_attendance(user["user_id"])
    stats = get_attendance_stats(records)
    return {"records": records, "stats": stats}
