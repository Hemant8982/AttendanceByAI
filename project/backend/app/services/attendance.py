from datetime import date, datetime, timezone
from app.database import supabase_admin


def get_today_record(user_id: str, today: date) -> dict | None:
    resp = supabase_admin.table("attendance").select("*").eq("user_id", user_id).eq("date", today.isoformat()).execute()
    return resp.data[0] if resp.data else None


def punch_in(user_id: str, lat: float, lng: float) -> dict:
    today = date.today()
    existing = get_today_record(user_id, today)
    if existing and existing.get("punch_in"):
        raise ValueError("Already punched in today")

    now = datetime.now(timezone.utc).isoformat()
    record = {
        "user_id": user_id,
        "date": today.isoformat(),
        "punch_in": now,
        "punch_in_lat": lat,
        "punch_in_lng": lng,
        "status": "incomplete",
    }

    if existing:
        resp = supabase_admin.table("attendance").update(record).eq("id", existing["id"]).execute()
    else:
        resp = supabase_admin.table("attendance").insert(record).execute()

    return resp.data[0]


def punch_out(user_id: str, lat: float, lng: float) -> dict:
    today = date.today()
    record = get_today_record(user_id, today)

    if not record or not record.get("punch_in"):
        raise ValueError("Must punch in first")
    if record.get("punch_out"):
        raise ValueError("Already punched out today")

    now = datetime.now(timezone.utc)
    punch_in_time = datetime.fromisoformat(record["punch_in"])
    total_hours = round((now - punch_in_time).total_seconds() / 3600, 2)
    status = "present" if total_hours >= 8 else "incomplete"

    update = {
        "punch_out": now.isoformat(),
        "punch_out_lat": lat,
        "punch_out_lng": lng,
        "total_hours": total_hours,
        "status": status,
    }

    resp = supabase_admin.table("attendance").update(update).eq("id", record["id"]).execute()
    return resp.data[0]


def get_week_attendance(user_id: str) -> list:
    today = date.today()
    start_of_week = today - __import__("datetime").timedelta(days=today.weekday())
    resp = (
        supabase_admin.table("attendance")
        .select("*")
        .eq("user_id", user_id)
        .gte("date", start_of_week.isoformat())
        .order("date", desc=True)
        .execute()
    )
    return resp.data


def get_attendance_stats(records: list) -> dict:
    present_days = sum(1 for r in records if r["status"] == "present")
    incomplete_days = sum(1 for r in records if r["status"] == "incomplete")
    total_hours = sum(r.get("total_hours", 0) or 0 for r in records)
    avg_hours = round(total_hours / len(records), 2) if records else 0
    return {
        "present_days": present_days,
        "incomplete_days": incomplete_days,
        "total_hours": round(total_hours, 2),
        "avg_hours_per_day": avg_hours,
        "total_days": len(records),
    }
