// ============================================================
// Cancela a assinatura do professor autenticado no Asaas e marca
// o status local como 'canceled' (o que bloqueia o acesso ao
// sistema — ver checagem em app.js).
//
// Chamada pelo frontend autenticado via:
//   supabase.functions.invoke('asaas-cancel-subscription')
// ============================================================
import { corsHeaders } from '../_shared/cors.ts';
import { asaasFetch } from '../_shared/asaas.ts';
import { supabaseAdmin, getRequestUser } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getRequestUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autenticado.' }), { status: 401, headers: corsHeaders });
    }

    const { data: sub } = await supabaseAdmin.from('subscriptions').select('*').eq('user_id', user.id).single();
    if (sub?.asaas_subscription_id) {
      await asaasFetch(`/subscriptions/${sub.asaas_subscription_id}`, { method: 'DELETE' });
    }

    await supabaseAdmin.from('subscriptions').update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message ?? 'Erro ao cancelar assinatura.' }), {
      status: 500, headers: corsHeaders,
    });
  }
});
