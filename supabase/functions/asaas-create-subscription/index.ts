// ============================================================
// Cria (ou reaproveita) o cliente no Asaas e gera a assinatura
// recorrente do Plano PRO. Retorna o link de pagamento da
// primeira cobrança para o professor concluir o pagamento.
//
// Chamada pelo frontend autenticado via:
//   supabase.functions.invoke('asaas-create-subscription')
// ============================================================
import { corsHeaders } from '../_shared/cors.ts';
import { asaasFetch } from '../_shared/asaas.ts';
import { supabaseAdmin, getRequestUser } from '../_shared/supabaseAdmin.ts';

const PLAN_VALUE = Number(Deno.env.get('ASAAS_PLAN_VALUE') ?? '19.90');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getRequestUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autenticado.' }), { status: 401, headers: corsHeaders });
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Perfil não encontrado.' }), { status: 404, headers: corsHeaders });
    }

    const { data: sub } = await supabaseAdmin.from('subscriptions').select('*').eq('user_id', user.id).single();

    // Se já existe uma assinatura ativa/pendente no Asaas, não cria outra —
    // só devolve o link de pagamento em aberto mais recente.
    let customerId = sub?.asaas_customer_id as string | undefined;
    let subscriptionId = sub?.asaas_subscription_id as string | undefined;

    if (!customerId) {
      const customer = await asaasFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({ name: profile.name, email: profile.email, externalReference: user.id }),
      });
      customerId = customer.id;
    }

    if (!subscriptionId) {
      const subscription = await asaasFetch('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          customer: customerId,
          billingType: 'UNDEFINED', // Asaas oferece Pix, boleto e cartão no checkout
          cycle: 'MONTHLY',
          value: PLAN_VALUE,
          nextDueDate: new Date().toISOString().slice(0, 10),
          description: 'Plano PRO — assinatura mensal',
        }),
      });
      subscriptionId = subscription.id;
    }

    await supabaseAdmin.from('subscriptions').update({
      asaas_customer_id: customerId,
      asaas_subscription_id: subscriptionId,
      plan_value: PLAN_VALUE,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    // busca a cobrança em aberto (pendente ou atrasada) dessa assinatura
    // para devolver o link de pagamento — cobre tanto a primeira
    // assinatura quanto o professor tentando regularizar um atraso.
    const payments = await asaasFetch(`/payments?subscription=${subscriptionId}`);
    const openPayment = (payments?.data ?? []).find((p: any) => p.status === 'PENDING' || p.status === 'OVERDUE');
    const checkoutUrl = openPayment?.invoiceUrl ?? payments?.data?.[0]?.invoiceUrl ?? null;

    return new Response(JSON.stringify({ checkoutUrl, subscriptionId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message ?? 'Erro ao criar assinatura.' }), {
      status: 500, headers: corsHeaders,
    });
  }
});
