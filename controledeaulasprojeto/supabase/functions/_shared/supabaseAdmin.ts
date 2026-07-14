// ============================================================
// Cliente Supabase com a service role key — só usado dentro das
// Edge Functions (nunca exposto ao navegador). Ignora RLS, então
// cada função é responsável por checar permissões antes de usar.
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Identifica o professor autenticado a partir do header Authorization
// enviado automaticamente pelo supabase.functions.invoke() do frontend.
export async function getRequestUser(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace('Bearer ', '');
  if (!jwt) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(jwt);
  if (error) return null;
  return data.user;
}
