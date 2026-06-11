import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Tools the booking agent can use
const tools: Anthropic.Tool[] = [
  {
    name: "check_calendar_availability",
    description: "Check if the artist is available on a given date",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        artist_id: { type: "string", description: "Artist UUID" },
      },
      required: ["date", "artist_id"],
    },
  },
  {
    name: "get_artist_profile",
    description: "Get the artist's profile including fees, genre, and riders",
    input_schema: {
      type: "object" as const,
      properties: {
        artist_id: { type: "string", description: "Artist UUID" },
      },
      required: ["artist_id"],
    },
  },
  {
    name: "update_booking_status",
    description: "Update the booking request status and save agent assessment",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_id: { type: "string", description: "Booking request UUID" },
        status: {
          type: "string",
          enum: ["reviewing", "negotiating", "confirmed", "declined"],
        },
        assessment: {
          type: "object",
          description: "Agent's structured assessment of the request",
          properties: {
            recommendation: { type: "string", enum: ["accept", "negotiate", "decline"] },
            fee_assessment: { type: "string" },
            date_available: { type: "boolean" },
            venue_fit: { type: "string" },
            priority_score: { type: "number", description: "1-10 score" },
            reasons: { type: "array", items: { type: "string" } },
          },
        },
        draft_response: {
          type: "string",
          description: "Professional email response to send to the promotor",
        },
        internal_notes: {
          type: "string",
          description: "Notes for the artist to review",
        },
      },
      required: ["booking_id", "status", "assessment", "draft_response"],
    },
  },
  {
    name: "save_agent_log",
    description: "Save a log entry for this booking interaction",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_id: { type: "string" },
        content: { type: "string" },
      },
      required: ["booking_id", "content"],
    },
  },
];

// Tool execution
async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  bookingId: string
): Promise<string> {
  const supabase = getSupabase();

  switch (toolName) {
    case "check_calendar_availability": {
      const { data } = await supabase
        .from("booking_requests")
        .select("event_date, status, venue_name")
        .eq("artist_id", toolInput.artist_id as string)
        .eq("event_date", toolInput.date as string)
        .in("status", ["confirmed", "negotiating"]);

      if (data && data.length > 0) {
        return JSON.stringify({
          available: false,
          conflict: `Already booked: ${data[0].venue_name}`,
        });
      }
      return JSON.stringify({ available: true });
    }

    case "get_artist_profile": {
      const { data } = await supabase
        .from("artists")
        .select("*")
        .eq("id", toolInput.artist_id as string)
        .single();

      return data
        ? JSON.stringify(data)
        : JSON.stringify({ error: "Artist not found" });
    }

    case "update_booking_status": {
      await supabase
        .from("booking_requests")
        .update({
          status: toolInput.status,
          agent_assessment: toolInput.assessment,
          agent_response: toolInput.draft_response,
          agent_notes: toolInput.internal_notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", toolInput.booking_id as string);

      return JSON.stringify({ success: true });
    }

    case "save_agent_log": {
      await supabase.from("agent_logs").insert({
        booking_request_id: toolInput.booking_id,
        role: "assistant",
        content: toolInput.content as string,
      });
      return JSON.stringify({ success: true });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

export interface BookingRequest {
  id: string;
  artist_id: string;
  promotor_name: string;
  promotor_email: string;
  venue_name: string;
  venue_city: string;
  venue_capacity: number | null;
  event_date: string;
  event_name: string | null;
  set_duration: number | null;
  offered_fee: number | null;
  additional_info: string | null;
}

export async function runBookingAgent(booking: BookingRequest) {
  const systemPrompt = `Je bent een professionele booking agent voor een artiest.
Je taak is om inkomende boekingsaanvragen te beoordelen en te verwerken.

Je werkt snel, professioneel en in het belang van de artiest. Je:
- Controleert altijd eerst de beschikbaarheid
- Haalt het artiestenprofiel op om de fee en fit te beoordelen
- Maakt een eerlijk assessment: is dit een goede boeking?
- Schrijft een professionele email response naar de promotor (in het Nederlands, tenzij de aanvraag in een andere taal is)
- Laat interne notities achter voor de artiest

Bij de fee beoordeling:
- Onder minimum fee: altijd onderhandelen of afwijzen
- Rond de base fee: accepteren als venue/datum goed is
- Boven base fee: altijd accepteren

Wees vriendelijk maar zakelijk in communicatie met promotors.`;

  const userMessage = `Verwerk deze boekingsaanvraag:

Promotor: ${booking.promotor_name} (${booking.promotor_email})
Venue: ${booking.venue_name}, ${booking.venue_city}
Capaciteit: ${booking.venue_capacity ?? "onbekend"}
Datum: ${booking.event_date}
Event: ${booking.event_name ?? "onbekend"}
Set duur: ${booking.set_duration ? `${booking.set_duration} minuten` : "onbekend"}
Aangeboden gage: ${booking.offered_fee ? `€${booking.offered_fee}` : "niet opgegeven"}
Extra info: ${booking.additional_info ?? "geen"}

Booking ID: ${booking.id}
Artist ID: ${booking.artist_id}

Gebruik de beschikbare tools om dit te verwerken.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  // Agentic loop
  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });

    // Add assistant response to message history
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            booking.id
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    } else {
      break;
    }
  }

  return messages;
}
