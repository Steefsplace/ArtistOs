import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runCommsAgent } from "@/lib/agents/comms-agent";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artist_id, from_name, from_email, subject, message_body, booking_request_id } = body;

    if (!artist_id || !from_name || !from_email || !message_body) {
      return NextResponse.json({ error: "Verplichte velden ontbreken" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: msg, error } = await supabase
      .from("messages")
      .insert({
        artist_id,
        booking_request_id: booking_request_id ?? null,
        from_name,
        from_email,
        subject,
        body: message_body,
        direction: "inbound",
        status: "unread",
      })
      .select()
      .single();

    if (error) {
      console.error("DB error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Run comms agent async
    runCommsAgent(msg)
      .then(() => console.log("✅ Comms agent done for message:", msg.id))
      .catch((e) => console.error("❌ Comms agent error:", e.message));

    return NextResponse.json({ success: true, message_id: msg.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
