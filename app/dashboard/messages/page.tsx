import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const statusLabels: Record<string, { label: string; class: string }> = {
  unread: { label: "Nieuw", class: "bg-[var(--accent-muted)] text-[var(--accent)]" },
  read: { label: "Gelezen", class: "bg-zinc-500/10 text-zinc-400" },
  draft: { label: "Concept klaar", class: "bg-blue-500/10 text-blue-400" },
  sent: { label: "Verstuurd", class: "bg-green-500/10 text-green-400" },
  archived: { label: "Gearchiveerd", class: "bg-zinc-500/10 text-zinc-400" },
};

interface Message {
  id: string;
  from_name: string;
  from_email: string;
  subject: string | null;
  body: string;
  direction: string;
  status: string;
  agent_draft: string | null;
  agent_notes: string | null;
  created_at: string;
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: messages } = artist
    ? await supabase
        .from("messages")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Berichten</h1>
        <p className="text-[var(--foreground)]/50 mt-1 text-sm">
          Inkomende berichten worden automatisch verwerkt door de AI Comms Agent
        </p>
      </div>

      {(!messages || messages.length === 0) && (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <span className="text-4xl block mb-4">📭</span>
          <p className="font-medium mb-2">Nog geen berichten</p>
          <p className="text-sm text-[var(--foreground)]/40">
            Berichten van promotors verschijnen hier automatisch
          </p>
        </div>
      )}

      {messages && messages.length > 0 && (
        <div className="space-y-4">
          {(messages as Message[]).map((msg) => {
            const status = statusLabels[msg.status] ?? statusLabels.unread;
            return (
              <div
                key={msg.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--border)]">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">
                        {msg.subject ?? "Geen onderwerp"}
                      </h3>
                      <span className={`text-xs rounded-full px-3 py-1 font-medium ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--foreground)]/50">
                      {msg.from_name} · {msg.from_email} · {new Date(msg.created_at).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                </div>

                {/* Original message */}
                <div className="px-6 py-4 bg-[var(--surface-2)]">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/40 mb-2">
                    Ontvangen bericht
                  </p>
                  <p className="text-sm text-[var(--foreground)]/70 whitespace-pre-wrap leading-relaxed">
                    {msg.body}
                  </p>
                </div>

                {/* Agent draft */}
                {msg.agent_draft && (
                  <div className="px-6 py-5 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/40">
                      AI Concept Response
                    </p>

                    {msg.agent_notes && (
                      <div className="rounded-lg bg-[var(--accent-muted)] border border-[var(--accent)]/20 px-4 py-3">
                        <p className="text-xs font-medium text-[var(--accent)] mb-1">Interne notitie van agent</p>
                        <p className="text-sm text-[var(--foreground)]/70">{msg.agent_notes}</p>
                      </div>
                    )}

                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4">
                      <p className="text-sm text-[var(--foreground)]/80 whitespace-pre-wrap leading-relaxed">
                        {msg.agent_draft}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button className="h-9 rounded-full bg-[var(--accent)] text-white px-5 text-xs font-semibold hover:opacity-90 transition-opacity">
                        ✓ Goedkeuren & versturen
                      </button>
                      <button className="h-9 rounded-full border border-[var(--border)] px-5 text-xs font-medium hover:bg-[var(--surface-2)] transition-colors">
                        Bewerken
                      </button>
                      <button className="h-9 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 px-5 text-xs font-semibold ml-auto hover:bg-red-500/20 transition-colors">
                        Archiveren
                      </button>
                    </div>
                  </div>
                )}

                {/* Waiting for agent */}
                {!msg.agent_draft && msg.status === "unread" && (
                  <div className="px-6 py-4 flex items-center gap-2 text-sm text-[var(--foreground)]/40">
                    <span className="animate-spin">⏳</span>
                    Agent verwerkt dit bericht…
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
