import re
from datetime import date
from app.database import supabase_admin


INTENT_PATTERNS = {
    "late_today": [r"\blate\b", r"\barrived late\b", r"\bcame late\b"],
    "less_than_8h": [r"\bless than 8\b", r"\bincomplete\b", r"\bunder 8\b", r"\bshort\b"],
    "pending_overtime": [r"\bpending overtime\b", r"\bovertime request\b", r"\bunapproved\b"],
    "summary": [r"\bsummary\b", r"\bsummarize\b", r"\battendance for\b"],
    "present_today": [r"\bpresent\b", r"\bwho was here\b", r"\bwho came\b"],
    "absent_today": [r"\babsent\b", r"\bmissing\b", r"\bnot here\b"],
}


def detect_intent(query: str) -> str:
    q = query.lower()
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, q):
                return intent
    return "unknown"


def fetch_intent_data(intent: str, user_id: str, user_role: str) -> list:
    today = date.today().isoformat()

    if intent == "late_today":
        resp = (
            supabase_admin.table("attendance")
            .select("*, profiles(full_name)")
            .eq("date", today)
            .gte("punch_in", f"{today}T09:00:00")
            .execute()
        )
        return resp.data

    elif intent == "less_than_8h":
        query = (
            supabase_admin.table("attendance")
            .select("*, profiles(full_name)")
            .lt("total_hours", 8)
            .gt("total_hours", 0)
        )
        if user_role != "admin":
            from datetime import timedelta
            start_of_week = (date.today() - timedelta(days=date.today().weekday())).isoformat()
            query = query.gte("date", start_of_week)
        resp = query.limit(20).execute()
        return resp.data

    elif intent == "pending_overtime":
        resp = (
            supabase_admin.table("overtime_requests")
            .select("*, profiles(full_name)")
            .eq("status", "pending")
            .execute()
        )
        return resp.data

    elif intent == "summary":
        resp = (
            supabase_admin.table("attendance")
            .select("*, profiles(full_name)")
            .eq("date", today)
            .execute()
        )
        return resp.data

    elif intent == "present_today":
        resp = (
            supabase_admin.table("attendance")
            .select("*, profiles(full_name)")
            .eq("date", today)
            .neq("status", "absent")
            .execute()
        )
        return resp.data

    elif intent == "absent_today":
        all_profiles = supabase_admin.table("profiles").select("id, full_name").execute()
        present = (
            supabase_admin.table("attendance")
            .select("user_id")
            .eq("date", today)
            .neq("status", "absent")
            .execute()
        )
        present_ids = {r["user_id"] for r in present.data}
        absent = [p for p in all_profiles.data if p["id"] not in present_ids]
        return absent

    return []


def format_response(intent: str, data: list) -> str:
    if intent == "late_today":
        if not data:
            return "No one was late today!"
        lines = [f"- {r['profiles']['full_name']} (punched in at {r['punch_in'][11:16]})" for r in data]
        return f"Late arrivals today:\n" + "\n".join(lines)

    elif intent == "less_than_8h":
        if not data:
            return "No records with less than 8 hours found."
        lines = [f"- {r['profiles']['full_name']}: {r['total_hours']}h on {r['date']}" for r in data]
        return f"Records with less than 8 hours:\n" + "\n".join(lines)

    elif intent == "pending_overtime":
        if not data:
            return "No pending overtime requests."
        lines = [f"- {r['profiles']['full_name']}: {r['hours']}h on {r['date']} - {r['reason']}" for r in data]
        return f"Pending overtime requests:\n" + "\n".join(lines)

    elif intent == "summary":
        present = sum(1 for r in data if r["status"] == "present")
        incomplete = sum(1 for r in data if r["status"] == "incomplete")
        absent = sum(1 for r in data if r["status"] == "absent")
        return f"Today's summary: {present} present, {incomplete} incomplete, {absent} absent (out of {len(data)} records)"

    elif intent == "present_today":
        if not data:
            return "No one is present today."
        lines = [f"- {r['profiles']['full_name']} ({r['status']})" for r in data]
        return f"Present today:\n" + "\n".join(lines)

    elif intent == "absent_today":
        if not data:
            return "No one is absent today!"
        lines = [f"- {p['full_name']}" for p in data]
        return f"Absent today:\n" + "\n".join(lines)

    return (
        "I can help you with:\n"
        "- Who was late today?\n"
        "- Who worked less than 8 hours?\n"
        "- Pending overtime requests\n"
        "- Today's attendance summary\n"
        "- Who is present/absent today?"
    )
