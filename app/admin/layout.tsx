export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
