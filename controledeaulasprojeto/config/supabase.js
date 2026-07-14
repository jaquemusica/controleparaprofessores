// ============================================================
// Configuração central de conexão com o Supabase.
// Único lugar do projeto onde a URL e a chave pública ficam.
// A chave "anon" é pública por natureza (protegida pelo RLS),
// nunca coloque aqui chaves secretas (service_role, Asaas, Resend).
// ============================================================
const SUPABASE_URL = 'https://fwvjpokuyqwjgjbahcqx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-QU-U0iclMUJ-U-GNtxLwA_d3dL-oJj';

export const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
