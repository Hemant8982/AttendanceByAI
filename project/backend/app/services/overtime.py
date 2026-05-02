from app.database import supabase_admin


def submit_overtime_request(user_id: str, date: str, hours: float, reason: str) -> dict:
    if hours < 0.5 or hours > 12:
        raise ValueError("Hours must be between 0.5 and 12")

    record = {
        "user_id": user_id,
        "date": date,
        "hours": hours,
        "reason": reason,
        "status": "pending",
    }
    resp = supabase_admin.table("overtime_requests").insert(record).execute()
    return resp.data[0]


def get_user_overtime_requests(user_id: str) -> list:
    resp = (
        supabase_admin.table("overtime_requests")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


def get_all_overtime_requests() -> list:
    resp = (
        supabase_admin.table("overtime_requests")
        .select("*, profiles(full_name)")
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


def update_overtime_status(request_id: str, status: str) -> dict:
    if status not in ("approved", "rejected"):
        raise ValueError("Status must be 'approved' or 'rejected'")

    resp = supabase_admin.table("overtime_requests").update({"status": status}).eq("id", request_id).execute()
    if not resp.data:
        raise ValueError("Overtime request not found")
    return resp.data[0]
