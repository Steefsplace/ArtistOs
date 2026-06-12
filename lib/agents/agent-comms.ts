import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export type AgentName = "marie" | "fleur" | "luuk" | "william";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Shared tools every agent gets
export const agentCommTools: Anthropic.Tool[] = [
  {
    name: "send_to_agent",
    description:
      "Send an internal message to another agent on the team (Marie, Fleur, Luuk, or William)",
    input_schema: {
      type: "object" as const,
      properties: {
        to_agent: {
          type: "string",
          enum: ["marie", "fleur", "luuk", "william"],
          description: "Which agent to send to",
        },
        subject: { type: "string", description: "Short subject line" },
        body: {
          type: "string",
          description:
            "Full message — be specific, include relevant IDs and context",
        },
        priority: {
          type: "string",
          enum: ["low", "normal", "urgent"],
          description: "Message priority",
        },
        booking_id: {
          type: "string",
          description: "Related booking ID (optional)",
        },
      },
      required: ["to_agent", "subject", "body"],
    },
  },
  {
    name: "read_agent_inbox",
    description: "Read unread messages from other agents in the team inbox",
    input_schema: {
      type: "object" as const,
      properties: {
        artist_id: { type: "string" },
      },
      required: ["artist_id"],
    },
  },
];

export async function executeAgentCommTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  fromAgent: AgentName,
  artistId: string
): Promise<string> {
  const supabase = getSupabase();

  if (toolName === "send_to_agent") {
    const { error } = await supabase.from("agent_messages").insert({
      artist_id: artistId,
      booking_id: toolInput.booking_id ?? null,
      from_agent: fromAgent,
      to_agent: toolInput.to_agent,
      subject: toolInput.subject,
      body: toolInput.body,
      priority: toolInput.priority ?? "normal",
    });

    if (error) return JSON.stringify({ error: error.message });

    // Trigger the target agent if there's a booking_id context
    if (toolInput.booking_id) {
      triggerAgent(
        toolInput.to_agent as AgentName,
        artistId,
        toolInput.booking_id as string
      );
    }

    return JSON.stringify({
      success: true,
      message: `Bericht verstuurd naar ${toolInput.to_agent}`,
    });
  }

  if (toolName === "read_agent_inbox") {
    const { data } = await supabase
      .from("agent_messages")
      .select("*")
      .eq("artist_id", artistId)
      .eq("to_agent", fromAgent)
      .is("read_at", null)
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      // Mark as read
      await supabase
        .from("agent_messages")
        .update({ read_at: new Date().toISOString() })
        .in(
          "id",
          data.map((m) => m.id)
        );
    }

    return JSON.stringify(data ?? []);
  }

  return JSON.stringify({ error: `Unknown comms tool: ${toolName}` });
}

// Lazy-import to avoid circular deps — triggers the right agent based on name
function triggerAgent(agent: AgentName, artistId: string, bookingId: string) {
  switch (agent) {
    case "fleur": {
      import("./comms-agent").then(({ runCommsAgent }) => {
        // Fleur needs a message object — send a handoff message
        runCommsAgent({
          id: `handoff-${Date.now()}`,
          artist_id: artistId,
          booking_request_id: bookingId,
          from_name: "ArtistOS Team",
          from_email: "team@artistos.nl",
          subject: "Interne handoff van team",
          body: `Er is een interne overdracht voor boeking ${bookingId}. Controleer je inbox voor context van andere agents.`,
        }).catch((e) => console.error("Fleur trigger error:", e.message));
      });
      break;
    }
    case "luuk": {
      import("./contract-agent").then(({ runContractAgent }) => {
        runContractAgent({ booking_id: bookingId }).catch((e) =>
          console.error("Luuk trigger error:", e.message)
        );
      });
      break;
    }
    case "william": {
      import("./finance-agent").then(({ runFinanceAgent }) => {
        runFinanceAgent({
          type: "generate_invoice",
          booking_id: bookingId,
          artist_id: artistId,
        }).catch((e) => console.error("William trigger error:", e.message));
      });
      break;
    }
  }
}
