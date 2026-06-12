import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const statusLabels: Record<string, { label: string; class: string }> = {
  draft: { label: "Concept", class: "bg-zinc-500/10 text-zinc-400" },
  sent: { label: "Verstuurd", class: "bg-blue-500/10 text-blue-400" },
  paid: { label: "Betaald", class: "bg-[var(--accent-muted)] text-[var(--accent)]" },
  overdue: { label: "Te laat", class: "bg-red-500/10 text-red-400" },
  cancelled: { label: "Geannuleerd", class: "bg-zinc-500/10 text-zinc-400" },
};

const typeLabels: Record<string, string> = {
  deposit: "Aanbetaling",
  final: "Restbetaling",
  full: "Volledige betaling",
};

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  amount_ex_vat: number;
  vat_rate: number;
  amount_incl_vat: number;
  description: string | null;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

function formatEur(amount: number) {
  return `€${amount.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`;
}

export default async function FinancesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: invoices } = artist
    ? await supabase
        .from("invoices")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const list = (invoices ?? []) as Invoice[];

  const totalPaid = list
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount_incl_vat, 0);

  const totalOutstanding = list
    .filter((i) => ["sent", "overdue"].includes(i.status))
    .reduce((s, i) => s + i.amount_incl_vat, 0);

  const totalOverdue = list
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.amount_incl_vat, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Financiën</h1>
        <p className="text-[var(--foreground)]/50 mt-1 text-sm">
          William beheert facturen, betalingen en financieel overzicht
        </p>
      </div>

      {/* Agent info card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-lg flex-shrink-0">
          💶
        </div>
        <div>
          <p className="font-semibold text-sm">William — Finance Agent</p>
          <p className="text-xs text-[var(--foreground)]/50 mt-1 leading-relaxed">
            William genereert automatisch facturen, houdt betalingen bij en signaleert openstaande posten.
          </p>
        </div>
        <span className="ml-auto text-xs rounded-full px-3 py-1 bg-[var(--accent-muted)] text-[var(--accent)] font-medium flex-shrink-0">
          Actief
        </span>
      </div>

      {/* Summary cards */}
      {list.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs text-[var(--foreground)]/40 uppercase tracking-widest mb-2">Betaald</p>
            <p className="text-2xl font-bold text-[var(--accent)]">{formatEur(totalPaid)}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs text-[var(--foreground)]/40 uppercase tracking-widest mb-2">Uitstaand</p>
            <p className="text-2xl font-bold">{formatEur(totalOutstanding)}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs text-[var(--foreground)]/40 uppercase tracking-widest mb-2">Te laat</p>
            <p className={`text-2xl font-bold ${totalOverdue > 0 ? "text-red-400" : ""}`}>
              {formatEur(totalOverdue)}
            </p>
          </div>
        </div>
      )}

      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <span className="text-4xl block mb-4">💶</span>
          <p className="font-medium mb-2">Nog geen facturen</p>
          <p className="text-sm text-[var(--foreground)]/40">
            William maakt automatisch facturen aan bij bevestigde boekingen
          </p>
        </div>
      )}

      {list.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/40">Factuurnummer</th>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/40">Type</th>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/40">Bedrag</th>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/40">Vervaldatum</th>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/40">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((inv) => {
                const status = statusLabels[inv.status] ?? statusLabels.draft;
                return (
                  <tr key={inv.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-4 text-[var(--foreground)]/60">{typeLabels[inv.invoice_type] ?? inv.invoice_type}</td>
                    <td className="px-4 py-4 font-semibold">{formatEur(inv.amount_incl_vat)}</td>
                    <td className="px-4 py-4 text-[var(--foreground)]/60">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString("nl-NL") : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs rounded-full px-3 py-1 font-medium ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
