import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-6 py-12 text-sm text-[var(--foreground)]/40">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <span className="font-bold text-base text-[var(--foreground)]/60">
          Artist<span className="text-[var(--accent)]">OS</span>
        </span>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-[var(--foreground)] transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-[var(--foreground)] transition-colors">Voorwaarden</Link>
          <Link href="#" className="hover:text-[var(--foreground)] transition-colors">Contact</Link>
        </div>
        <p>© {new Date().getFullYear()} ArtistOS. Alle rechten voorbehouden.</p>
      </div>
    </footer>
  );
}
