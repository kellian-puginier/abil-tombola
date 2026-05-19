import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false as const };
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && data.user.email !== adminEmail) {
    return { ok: false as const };
  }
  return { ok: true as const, user: data.user };
}
