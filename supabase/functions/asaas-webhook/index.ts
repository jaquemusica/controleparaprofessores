// ============================================================
// Recebe os webhooks do Asaas e mantém o status da assinatura em
// dia (renovação automática, atraso, cancelamento). Esta função
// NÃO é chamada pelo frontend — é o Asaas que chama ela.
//
// Configuração no painel do Asaas (Integrações > Webhooks):
//   URL: https://<seu-projeto>.supabase.co/functions/v1/asaas-webhook
//   Token de autenticação: o mesmo valor de ASAAS_WEBHOOK_TOKEN
//   Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE,
//            PAYMENT_DELETED, PAYMENT_REFUNDED, SUBSCRIPTION_DELETED
// ============================================================
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { sendEmail } from '../_shared/resend.ts';
import { paymentApprovedEmailHtml } from '../_shared/emailTemplates.ts';

const WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') ?? '';

const STATUS_BY_EVENT: Record<string, 'active' | 'overdue' | 'canceled'> = {
  PAYMENT_CONFIRMED: 'active',
  PAYMENT_RECEIVED: 'active',
  PAYMENT_OVERDUE: 'overdue',
  PAYMENT_DELETED: 'canceled',
  PAYMENT_REFUNDED: 'canceled',
  SUBSCRIPTION_DELETED: 'canceled',
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  // Valida a origem do webhook (token configurado no painel do Asaas).
  if (WEBHOOK_TOKEN && req.headers.get('asaas-access-token') !== WEBHOOK_TOKEN) {
    return new Response('unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const event = body?.event as string;
    const newStatus = STATUS_BY_EVENT[event];
    const subscriptionId = body?.payment?.subscription;

    if (!newStatus || !subscriptionId) {
      // Evento que não altera status (ex.: PAYMENT_CREATED) — apenas confirma recebimento.
      return new Response('ok', { status: 200 });
    }

    const { data: updatedRows } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('asaas_subscription_id', subscriptionId)
      .select('user_id');

    // "Pagamento aprovado": só faz sentido avisar quando o pagamento
    // foi de fato confirmado (não em atraso/cancelamento).
    if (newStatus === 'active' && updatedRows?.[0]?.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('name, email')
        .eq('id', updatedRows[0].user_id)
        .single();
      if (profile) {
        await sendEmail(profile.email, 'Pagamento aprovado', paymentApprovedEmailHtml(profile.name));
      }
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('erro ao processar webhook', { status: 500 });
  }
});
