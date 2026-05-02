from app.database import supabase_admin


def get_all_employees() -> list:
    resp = supabase_admin.table("profiles").select("*").order("created_at", desc=True).execute()
    return resp.data


def get_all_attendance(date_from: str | None = None, date_to: str | None = None, search: str | None = None) -> list:
    query = supabase_admin.table("attendance").select("*, profiles(full_name)").order("date", desc=True).limit(100)

    if date_from:
        query = query.gte("date", date_from)
    if date_to:
        query = query.lte("date", date_to)

    resp = query.execute()
    records = resp.data

    if search:
        search_lower = search.lower()
        records = [r for r in records if search_lower in (r.get("profiles", {}).get("full_name", "").lower())]

    return records


def get_attendance_csv(date_from: str | None = None, date_to: str | None = None) -> str:
    records = get_all_attendance(date_from, date_to)
    lines = ["Employee,Date,Punch In,Punch Out,Hours,Status"]
    for r in records:
        name = r.get("profiles", {}).get("full_name", "")
        punch_in = (r.get("punch_in") or "")[11:16]
        punch_out = (r.get("punch_out") or "")[11:16]
        hours = r.get("total_hours", 0) or 0
        lines.append(f"{name},{r['date']},{punch_in},{punch_out},{hours},{r['status']}")
    return "\n".join(lines)
