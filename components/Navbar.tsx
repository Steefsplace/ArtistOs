import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-[var(--accent)] font-bold text-lg tracking-tight">
          Artist<span className="text-[var(--foreground)]">OS</span>
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--foreground)]/60">
        <Link href="#features" className="hover:text-[var(--foreground)] transition-colors">
          Features
        </Link>
        <Link href="#" className="hover:text-[var(--foreground)] transition-colors">
          Prijzen
        </Link>
        <Link href="#" className="hover:text-[var(--foreground)] transition-colors">
          Over ons
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="/auth/login"
          className="hidden sm:inline-flex h-9 items-center px-5 text-sm font-medium text-[var(--foreground)]/70 hover:text-[var(--foreground)] transition-colors"
        >
          Inloggen
        </Link>
        <Link
          href="/auth/signup"
          className="inline-flex h-9 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[#0c0c10] transition-opacity hover:opacity-90"
        >
          Gratis starten
        </Link>
      </div>
    </header>
  );
}
