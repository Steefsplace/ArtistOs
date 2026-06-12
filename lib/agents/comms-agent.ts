import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const tools: Anthropic.Tool[] = [
  {
    name: "get_artist_profile",
    description: "Get the artist's profile, tone preferences and bio",
    input_schema: {
      type: "object" as const,
      properties: {
        artist_id: { type: "string" },
      },
      required: ["artist_id"],
    },
  },
  {
    name: "get_booking_context",
    description: "Get the booking request linked to this message thread",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_request_id: { type: "string" },
      },
      required: ["booking_request_id"],
    },
  },
  {
    name: "get_message_history",
    description: "Get previous messages in this conversation thread",
    input_schema: {
      type: "object" as const,
      properties: {
        message_id: { type: "string", description: "The current message ID to find thread history" },
        artist_id: { type: "string" },
        from_email: { type: "string" },
      },
      required: ["artist_id", "from_email"],
    },
  },
  {
    name: "save_draft_response",
    description: "Save the AI-generated draft response to the message",
    input_schema: {
      type: "object" as const,
      properties: {
        message_id: { type: "string" },
        draft: { type: "string", description: "The professional email response to the sender" },
        notes: { type: "string", description: "Internal notes for the artist about this message" },
      },
      required: ["message_id", "draft"],
    },
  },
];

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  const supabase = getSupabase();

  switch (toolName) {
    case "get_artist_profile": {
      const { data } = await supabase
        .from("artists")
        .select("name, genre, bio, base_fee, min_fee")
        .eq("id", toolInput.artist_id as string)
        .single();
      return JSON.stringify(data ?? { error: "Artist not found" });
    }

    case "get_booking_context": {
      if (!toolInput.booking_request_id) return JSON.stringify({ error: "No booking linked" });
      const { data } = await supabase
        .from("booking_requests")
        .select("*")
        .eq("id", toolInput.booking_request_id as string)
        .single();
      return JSON.stringify(data ?? { error: "Booking not found" });
    }

    case "get_message_history": {
      const { data } = await supabase
        .from("messages")
        .select("direction, from_name, subject, body, created_at")
        .eq("artist_id", toolInput.artist_id as string)
        .eq("from_email", toolInput.from_email as string)
        .order("created_at", { ascending: true })
        .limit(10);
      return JSON.stringify(data ?? []);
    }

    case "save_draft_response": {
      await supabase
        .from("messages")
        .update({
          agent_draft: toolInput.draft,
          agent_notes: toolInput.notes,
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", toolInput.message_id as string);
      return JSON.stringify({ success: true });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

export interface InboundMessage {
  id: string;
  artist_id: string;
  booking_request_id: string | null;
  from_name: string;
  from_email: string;
  subject: string | null;
  body: string;
}

export async function runCommsAgent(message: InboundMessage) {
  const systemPrompt = `Je naam is Fleur en je bent de communicatie-agent van ArtistOS.
Je bent warm, scherp en weet precies hoe je de toon moet zetten. Je schrijft berichten die klinken als de artiest zelf — professioneel, maar met persoonlijkheid. Nooit corporate, altijd menselijk.

Je taak is om inkomende berichten te verwerken en professionele responses op te stellen namens de artiest.

Je schrijft altijd:
- In dezelfde taal als het inkomende bericht (Nederlands of Engels)
- Met de stem van de artiest: direct, authentiek, geen blabla
- Namens de artiest (in de eerste persoon: "Ik", "We")
- Zonder toezeggingen te doen die de artiest niet heeft goedgekeurd

Types berichten die je verwerkt:
- Boekingsaanvragen en follow-ups
- Vragen over riders en technische specificaties
- Betalingsvragen en factuurverzoeken
- Persberichten en interviewverzoeken
- Algemene vragen over de artiest

Geef altijd interne notities mee zodat de artiest precies weet wat er speelt en wat er van hem/haar verwacht wordt.

Onderteken je berichten altijd als: Fleur | Communicatie — ArtistOS`;

  const userMessage = `Verwerk dit inkomende bericht:

Van: ${message.from_name} <${message.from_email}>
Onderwerp: ${message.subject ?? "Geen onderwerp"}
Bericht:
${message.body}

---
Message ID: ${message.id}
Artist ID: ${message.artist_id}
${message.booking_request_id ? `Gekoppelde boeking: ${message.booking_request_id}` : "Geen boeking gekoppeld"}

Gebruik de tools om context op te halen en schrijf een professionele response.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") break;

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>
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
