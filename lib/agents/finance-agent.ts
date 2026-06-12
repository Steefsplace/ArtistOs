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
    name: "get_booking_for_invoice",
    description: "Get booking details needed to generate an invoice",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_id: { type: "string" },
      },
      required: ["booking_id"],
    },
  },
  {
    name: "create_invoice",
    description: "Create a new invoice record in the database",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_id: { type: "string" },
        artist_id: { type: "string" },
        invoice_number: { type: "string", description: "e.g. INV-2026-001" },
        amount_ex_vat: { type: "number", description: "Amount excluding VAT" },
        vat_rate: { type: "number", description: "VAT percentage, e.g. 21" },
        amount_incl_vat: { type: "number" },
        description: { type: "string" },
        due_date: { type: "string", description: "ISO date YYYY-MM-DD" },
        invoice_type: {
          type: "string",
          enum: ["deposit", "final", "full"],
          description: "Deposit (50% upfront), final (remaining), or full",
        },
        invoice_text: { type: "string", description: "Full invoice text in Markdown" },
      },
      required: [
        "booking_id",
        "artist_id",
        "invoice_number",
        "amount_ex_vat",
        "vat_rate",
        "amount_incl_vat",
        "description",
        "due_date",
        "invoice_type",
        "invoice_text",
      ],
    },
  },
  {
    name: "get_artist_invoices",
    description: "Get all invoices for an artist, optionally filtered by status",
    input_schema: {
      type: "object" as const,
      properties: {
        artist_id: { type: "string" },
        status: {
          type: "string",
          enum: ["draft", "sent", "paid", "overdue", "cancelled"],
          description: "Filter by status (optional)",
        },
      },
      required: ["artist_id"],
    },
  },
  {
    name: "update_invoice_status",
    description: "Update an invoice status (e.g. mark as paid or overdue)",
    input_schema: {
      type: "object" as const,
      properties: {
        invoice_id: { type: "string" },
        status: {
          type: "string",
          enum: ["draft", "sent", "paid", "overdue", "cancelled"],
        },
        paid_at: { type: "string", description: "ISO datetime when paid (optional)" },
      },
      required: ["invoice_id", "status"],
    },
  },
  {
    name: "save_finance_log",
    description: "Save a financial action log entry",
    input_schema: {
      type: "object" as const,
      properties: {
        artist_id: { type: "string" },
        booking_id: { type: "string" },
        action: { type: "string" },
        amount: { type: "number" },
        notes: { type: "string" },
      },
      required: ["artist_id", "action"],
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
    case "get_booking_for_invoice": {
      const { data } = await supabase
        .from("booking_requests")
        .select("*, artists(*)")
        .eq("id", toolInput.booking_id as string)
        .single();

      return data
        ? JSON.stringify(data)
        : JSON.stringify({ error: "Booking not found" });
    }

    case "create_invoice": {
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          booking_id: toolInput.booking_id,
          artist_id: toolInput.artist_id,
          invoice_number: toolInput.invoice_number,
          amount_ex_vat: toolInput.amount_ex_vat,
          vat_rate: toolInput.vat_rate,
          amount_incl_vat: toolInput.amount_incl_vat,
          description: toolInput.description,
          due_date: toolInput.due_date,
          invoice_type: toolInput.invoice_type,
          invoice_text: toolInput.invoice_text,
          status: "draft",
        })
        .select()
        .single();

      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, invoice_id: data.id });
    }

    case "get_artist_invoices": {
      let query = supabase
        .from("invoices")
        .select("*")
        .eq("artist_id", toolInput.artist_id as string)
        .order("created_at", { ascending: false });

      if (toolInput.status) {
        query = query.eq("status", toolInput.status as string);
      }

      const { data } = await query;
      return JSON.stringify(data ?? []);
    }

    case "update_invoice_status": {
      const update: Record<string, unknown> = {
        status: toolInput.status,
        updated_at: new Date().toISOString(),
      };
      if (toolInput.paid_at) update.paid_at = toolInput.paid_at;

      await supabase
        .from("invoices")
        .update(update)
        .eq("id", toolInput.invoice_id as string);

      return JSON.stringify({ success: true });
    }

    case "save_finance_log": {
      await supabase.from("finance_logs").insert({
        artist_id: toolInput.artist_id,
        booking_id: toolInput.booking_id ?? null,
        action: toolInput.action,
        amount: toolInput.amount ?? null,
        notes: toolInput.notes ?? null,
      });
      return JSON.stringify({ success: true });
    }

    default:
      if (toolName === "send_to_agent" || toolName === "read_agent_inbox") {
        return executeAgentCommTool(toolName, toolInput, "william", artistId);
      }
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

export interface FinanceTask {
  type: "generate_invoice" | "check_overdue" | "payment_summary";
  booking_id?: string;
  artist_id?: string;
}

export async function runFinanceAgent(task: FinanceTask) {
  const systemPrompt = `Je naam is William en je bent de finance-agent van ArtistOS.
Je bent methodisch, nauwkeurig en houdt van orde. Je weet precies wat er financieel speelt rond een boeking en zorgt dat de artiest altijd op tijd betaald wordt.

Je taken:
1. **Facturen genereren** — bij een bevestigde boeking maak je automatisch een aanbetaling-factuur aan (50% vooraf)
2. **Betalingen tracken** — je houdt bij welke facturen openstaan en welke betaald zijn
3. **Herinneringen** — je signaleert achterstallige betalingen en stelt herinneringsteksten op
4. **Overzichten** — je geeft de artiest een helder financieel beeld

Bij het genereren van facturen:
- Gebruik een factuurformat: INV-[JAAR]-[NUMMER], bijv. INV-2026-001
- Bereken BTW correct (standaard 21% voor entertainment)
- Vermeld betalingstermijn duidelijk (14 dagen voor aanbetaling)
- Maak de factuurstekst professioneel maar leesbaar

Je werkt samen met Marie (booking), Fleur (communicatie) en Luuk (contracten). Lees altijd eerst je inbox. Stuur Fleur een bericht als een promotor herinnerd moet worden aan een betaling.

Onderteken je communicatie altijd als: William | Finance — ArtistOS`;

  const artistId = task.artist_id ?? "";

  let userMessage: string;

  if (task.type === "generate_invoice" && task.booking_id) {
    userMessage = `Genereer een factuur voor boeking ID: ${task.booking_id}

Lees eerst je inbox (read_agent_inbox met artist_id: ${artistId}).
Haal de boekingsdetails op en maak een aanbetaling-factuur aan (50% van de overeengekomen gage).
Sla de factuur op in de database.`;
  } else if (task.type === "check_overdue" && task.artist_id) {
    userMessage = `Controleer openstaande facturen voor artiest ID: ${task.artist_id}

Haal alle openstaande facturen op en check welke over de betaaldatum heen zijn.
Update de status naar 'overdue' waar van toepassing en log een notitie.`;
  } else if (task.type === "payment_summary" && task.artist_id) {
    userMessage = `Geef een betalingsoverzicht voor artiest ID: ${task.artist_id}

Haal alle facturen op en geef een samenvatting: totaal uitstaand, totaal betaald, en openstaande posten.`;
  } else {
    userMessage = `Verwerk financiële taak: ${JSON.stringify(task)}`;
  }

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
