import { NextRequest, NextResponse } from "next/server";
import { runFinanceAgent } from "@/lib/agents/finance-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, booking_id, artist_id } = body;

    if (!type) {
      return NextResponse.json({ error: "type is verplicht" }, { status: 400 });
    }

    runFinanceAgent({ type, booking_id, artist_id })
      .then(() => console.log("✅ Finance agent done:", type))
      .catch((e) => console.error("❌ Finance agent error:", e.message));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
