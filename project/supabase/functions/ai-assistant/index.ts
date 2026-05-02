import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { query, userId, userRole } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];
    const q = query.toLowerCase();
    let response = "";

    if (q.includes("late") || q.includes("came late")) {
      const { data } = await supabase
        .from("attendance")
        .select("*, profiles(full_name)")
        .eq("date", today)
        .gte("punch_in", `${today}T09:00:00`);
      if (!data?.length) {
        response = "No one came late today (after 9:00 AM).";
      } else {
        response = "Late arrivals today:\n" + data.map((r: any) => `- ${r.profiles?.full_name} at ${new Date(r.punch_in).toLocaleTimeString()}`).join("\n");
      }
    } else if (q.includes("less than 8") || q.includes("incomplete") || q.includes("under 8")) {
      const { data } = await supabase
        .from("attendance")
        .select("*, profiles(full_name)")
        .lt("total_hours", 8)
        .gt("total_hours", 0)
        .order("date", { ascending: false })
        .limit(20);
      if (!data?.length) {
        response = "No employees with less than 8 hours found.";
      } else {
        response = "Employees with < 8 hours:\n" + data.map((r: any) => `- ${r.profiles?.full_name} on ${r.date}: ${r.total_hours}h`).join("\n");
      }
    } else if (q.includes("pending overtime") || q.includes("overtime request")) {
      const { data } = await supabase
        .from("overtime_requests")
        .select("*, profiles(full_name)")
        .eq("status", "pending");
      if (!data?.length) {
        response = "No pending overtime requests.";
      } else {
        response = "Pending overtime:\n" + data.map((r: any) => `- ${r.profiles?.full_name}: ${r.hours}h on ${r.date} - "${r.reason}"`).join("\n");
      }
    } else if (q.includes("summary") || q.includes("summarize")) {
      const { data } = await supabase
        .from("attendance")
        .select("*, profiles(full_name)")
        .eq("date", today);
      if (!data?.length) {
        response = `No attendance records for ${today}.`;
      } else {
        const present = data.filter((r: any) => r.status === "present").length;
        const incomplete = data.filter((r: any) => r.status === "incomplete").length;
        response = `Summary for ${today}:\n- Present: ${present}\n- Incomplete: ${incomplete}\n- Total: ${data.length}`;
      }
    } else {
      response = 'I can help with:\n- "Who came late today?"\n- "Show employees with less than 8 hours"\n- "Show pending overtime requests"\n- "Summarize attendance for today"';
    }

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to process query" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
