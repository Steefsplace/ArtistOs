import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runBookingAgent } from "@/lib/agents/booking-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      artist_id,
      promotor_name,
      promotor_email,
      promotor_phone,
      venue_name,
      venue_city,
      venue_capacity,
      event_date,
      event_name,
      set_duration,
      offered_fee,
      additional_info,
    } = body;

    // Validate required fields
    if (!artist_id || !promotor_name || !promotor_email || !venue_name || !venue_city || !event_date) {
      return NextResponse.json(
        { error: "Verplichte velden ontbreken" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Save the booking request
    const { data: booking, error } = await supabase
      .from("booking_requests")
      .insert({
        artist_id,
        promotor_name,
        promotor_email,
        promotor_phone,
        venue_name,
        venue_city,
        venue_capacity: venue_capacity ? parseInt(venue_capacity) : null,
        event_date,
        event_name,
        set_duration: set_duration ? parseInt(set_duration) : null,
        offered_fee: offered_fee ? parseInt(offered_fee) : null,
        additional_info,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("DB error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Run the booking agent asynchronously
    runBookingAgent(booking).catch(console.error);

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      message: "Aanvraag ontvangen. We nemen zo snel mogelijk contact op.",
    });
  } catch (err) {
    console.error("Booking agent error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const artist_id = searchParams.get("artist_id");

  if (!artist_id) {
    return NextResponse.json({ error: "artist_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("artist_id", artist_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings: data });
}
