import { NextRequest, NextResponse } from "next/server";
import { runContractAgent } from "@/lib/agents/contract-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ error: "booking_id is verplicht" }, { status: 400 });
    }

    runContractAgent({ booking_id })
      .then(() => console.log("✅ Contract agent done for booking:", booking_id))
      .catch((e) => console.error("❌ Contract agent error:", e.message));

    return NextResponse.json({ success: true, booking_id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
