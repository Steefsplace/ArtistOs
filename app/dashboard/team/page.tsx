import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const agentConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  marie:   { label: "Marie",   color: "text-purple-400", bg: "bg-purple-500/20", icon: "🎤" },
  fleur:   { label: "Fleur",   color: "text-blue-400",   bg: "bg-blue-500/20",   icon: "✉️" },
  luuk:    { label: "Luuk",    color: "text-[var(--accent)]", bg: "bg-[var(--accent-muted)]", icon: "📄" },
  william: { label: "William", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: "💶" },
};

interface AgentMessage {
  id: string;
  from_agent: string;
  to_agent: string;
  subject: string;
  body: string;
  priority: string;
  read_at: string | null;
  created_at: string;
  booking_id: string | null;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m geleden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}u geleden`;
  return `${Math.floor(hours / 24)}d geleden`;
}

export default async function TeamPage() {
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
        .from("agent_messages")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };

  const list = (messages ?? []) as AgentMessage[];

  const unread = list.filter((m) => !m.read_at).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team communicatie</h1>
          <p className="text-[var(--foreground)]/50 mt-1 text-sm">
            Live feed van alle berichten tussen Marie, Fleur, Luuk en William
          </p>
        </div>
        {unread > 0 && (
          <span className="text-xs rounded-full px-3 py-1 bg-[var(--accent-muted)] text-[var(--accent)] font-semibold">
            {unread} nieuw
          </span>
        )}
      </div>

      {/* Agent legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(agentConfig).map(([key, a]) => (
          <div key={key} className={`flex items-center gap-2 rounded-full px-4 py-2 ${a.bg}`}>
            <span className="text-sm">{a.icon}</span>
            <span className={`text-xs font-semibold ${a.color}`}>{a.label}</span>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <span className="text-4xl block mb-4">💬</span>
          <p className="font-medium mb-2">Nog geen team communicatie</p>
          <p className="text-sm text-[var(--foreground)]/40">
            Zodra de agents met elkaar samenwerken verschijnt hier hun interne communicatie
          </p>
        </div>
      )}

      {list.length > 0 && (
        <div className="space-y-3">
          {list.map((msg) => {
            const from = agentConfig[msg.from_agent];
            const to = agentConfig[msg.to_agent];
            const isUrgent = msg.priority === "urgent";
            return (
              <div
                key={msg.id}
                className={`rounded-xl border bg-[var(--surface)] overflow-hidden transition-colors ${
                  !msg.read_at
                    ? "border-[var(--accent)]/30"
                    : "border-[var(--border)]"
                }`}
              >
                {/* Message header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
                  {/* From */}
                  <div className={`h-8 w-8 rounded-full ${from?.bg} flex items-center justify-center text-sm flex-shrink-0`}>
                    {from?.icon}
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-sm font-semibold ${from?.color}`}>
                      {from?.label}
                    </span>
                    <span className="text-[var(--foreground)]/30 text-xs">→</span>
                    <div className={`h-6 w-6 rounded-full ${to?.bg} flex items-center justify-center text-xs`}>
                      {to?.icon}
                    </div>
                    <span className={`text-sm font-semibold ${to?.color}`}>
                      {to?.label}
                    </span>
                  </div>

                  <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                    {isUrgent && (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-red-500/10 text-red-400 font-medium">
                        Urgent
                      </span>
                    )}
                    {!msg.read_at && (
                      <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    )}
                    <span className="text-xs text-[var(--foreground)]/30">
                      {timeAgo(msg.created_at)}
                    </span>
                  </div>
                </div>

                {/* Subject + body */}
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold mb-1">{msg.subject}</p>
                  <p className="text-sm text-[var(--foreground)]/60 leading-relaxed whitespace-pre-wrap">
                    {msg.body}
                  </p>
                  {msg.booking_id && (
                    <p className="text-xs text-[var(--foreground)]/30 mt-3 font-mono">
                      boeking: {msg.booking_id}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
