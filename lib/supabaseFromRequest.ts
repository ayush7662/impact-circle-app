import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseFromRequest(req: Request): SupabaseClient {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  const jwt = auth?.replace(/^Bearer\s+/i, "").trim();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      },
    },
  );
}

export async function getUserFromRequest(req: Request) {
  const supabase = createSupabaseFromRequest(req);
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, supabase, error };
}
