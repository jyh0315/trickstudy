import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 환경 변수가 없으면 Supabase 없이 브라우저(localStorage)에만 저장한다.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

async function ensureUser() {
  if (!supabase) throw new Error("Supabase가 설정되지 않았어요");
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user;
  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error || !anon.user) throw error ?? new Error("로그인 실패");
  return anon.user;
}

export async function cloudSave(save: unknown) {
  const user = await ensureUser();
  const { error } = await supabase!
    .from("saves")
    .upsert({ user_id: user.id, data: save, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function cloudLoad() {
  const user = await ensureUser();
  const { data, error } = await supabase!.from("saves").select("data").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return data?.data ?? null;
}
