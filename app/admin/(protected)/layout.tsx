import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/admin/login");

  return (
    <>
      <nav style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-6 py-3">
          <Link href="/admin/dashboard" className="font-display text-xl font-black" style={{ color: "var(--primary)" }}>
            ABIL Admin
          </Link>
          <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
            {[["Dashboard", "/admin/dashboard"], ["Tickets", "/admin/tickets"], ["Lots", "/admin/prizes"], ["Événements", "/admin/events"], ["Tirage", "/admin/draw"]].map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-foreground" style={{ color: "var(--muted-foreground)" }}>
                {label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex gap-3 text-sm">
            <Link href="/" style={{ color: "var(--muted-foreground)" }} className="hover:text-foreground transition">
              ← Voir le site
            </Link>
            <form action="/api/admin/logout" method="post">
              <button className="transition" style={{ color: "var(--muted-foreground)" }}>
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </>
  );
}
