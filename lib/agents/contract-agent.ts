import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { agentCommTools, executeAgentCommTool } from "./agent-comms";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const tools: Anthropic.Tool[] = [
  {
    name: "get_booking_details",
    description: "Get the full booking request details including artist profile",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_id: { type: "string", description: "Booking request UUID" },
      },
      required: ["booking_id"],
    },
  },
  {
    name: "save_contract",
    description: "Save the generated contract to the database",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_id: { type: "string" },
        contract_text: { type: "string", description: "Full contract text in Markdown" },
        contract_summary: { type: "string", description: "Short summary of key terms" },
        status: {
          type: "string",
          enum: ["draft", "sent", "signed", "cancelled"],
          description: "Initial contract status",
        },
      },
      required: ["booking_id", "contract_text", "contract_summary", "status"],
    },
  },
  {
    name: "update_booking_contract_status",
    description: "Update the booking to reflect contract has been generated",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_id: { type: "string" },
        contract_id: { type: "string" },
      },
      required: ["booking_id", "contract_id"],
    },
  },
  ...agentCommTools,
];

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  artistId: string
): Promise<string> {
  const supabase = getSupabase();

  switch (toolName) {
    case "get_booking_details": {
      const { data: booking } = await supabase
        .from("booking_requests")
        .select("*, artists(*)")
        .eq("id", toolInput.booking_id as string)
        .single();

      return booking
        ? JSON.stringify(booking)
        : JSON.stringify({ error: "Booking not found" });
    }

    case "save_contract": {
      const { data, error } = await supabase
        .from("contracts")
        .insert({
          booking_id: toolInput.booking_id,
          contract_text: toolInput.contract_text,
          contract_summary: toolInput.contract_summary,
          status: toolInput.status,
        })
        .select()
        .single();

      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, contract_id: data.id });
    }

    case "update_booking_contract_status": {
      await supabase
        .from("booking_requests")
        .update({
          contract_id: toolInput.contract_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", toolInput.booking_id as string);

      return JSON.stringify({ success: true });
    }

    default:
      if (toolName === "send_to_agent" || toolName === "read_agent_inbox") {
        return executeAgentCommTool(toolName, toolInput, "luuk", artistId);
      }
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

export interface ContractRequest {
  booking_id: string;
  artist_id?: string;
}

export async function runContractAgent(req: ContractRequest) {
  // Resolve artist_id if not provided
  if (!req.artist_id) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("booking_requests")
      .select("artist_id")
      .eq("id", req.booking_id)
      .single();
    if (data) req.artist_id = data.artist_id;
  }
  const artistId = req.artist_id ?? "";
  const systemPrompt = `Je naam is Luuk en je bent de contract-agent van ArtistOS.
Je bent precies, grondig en laat geen loopholes liggen. Je kent het entertainmentrecht en schrijft contracten die de artiest volledig beschermen. Je bent vriendelijk maar onverbiddelijk als het gaat om de kleine lettertjes.

Je taak is om professionele optreden-contracten op te stellen op basis van bevestigde boekingen.

Een goed contract bevat altijd:
- Partijen (artiest en opdrachtgever/promotor)
- Datum, tijd en locatie van het optreden
- Set duur en technische eisen (conform rider)
- Overeengekomen gage inclusief BTW-vermelding
- Betalingstermijn: 50% vooruit, 50% uiterlijk 7 dagen voor het optreden
- Annuleringsbeleid: bij annulering binnen 30 dagen 100% van de fee verschuldigd
- Overmacht clausule
- Productie- en hospitality rider verwijzing
- Ondertekeningsblok voor beide partijen

Schrijf het contract in het Nederlands tenzij de promotor duidelijk internationaal is.
Gebruik formele maar heldere taal — geen juridisch jargon dat niemand begrijpt.

Je werkt samen met Marie (booking), Fleur (communicatie) en William (finance). Stuur William een bericht zodra het contract klaar is zodat hij de factuur kan afstemmen op de contractbedragen. Stuur Fleur een bericht als de promotor gecontacteerd moet worden over ondertekening.

Onderteken je communicatie altijd als: Luuk | Contracten — ArtistOS`;

  const userMessage = `Stel een contract op voor boeking ID: ${req.booking_id}

Lees eerst je inbox (read_agent_inbox met artist_id van de boeking).
Haal daarna de boekingsdetails op, genereer het contract en sla het op.
Stuur tot slot een bericht naar William dat het contract klaar is.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
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
            block.input as Record<string, unknown>,
            artistId
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
