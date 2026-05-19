import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/admin/login");

  return (
    <>
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-6 py-3">
          <Link
            href="/admin/dashboard"
            className="font-display text-xl font-black"
          >
            ABIL Admin
          </Link>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <Link href="/admin/dashboard" className="hover:text-abil-green">
              Dashboard
            </Link>
            <Link href="/admin/tickets" className="hover:text-abil-green">
              Tickets
            </Link>
            <Link href="/admin/prizes" className="hover:text-abil-green">
              Lots
            </Link>
            <Link href="/admin/events" className="hover:text-abil-green">
              Événements
            </Link>
            <Link href="/admin/draw" className="hover:text-abil-green">
              Tirage
            </Link>
          </div>
          <div className="ml-auto flex gap-3 text-sm">
            <Link href="/" className="text-slate-500 hover:text-abil-green">
              ← Voir le site
            </Link>
            <form action="/api/admin/logout" method="post">
              <button className="text-slate-500 hover:text-red-600">
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
