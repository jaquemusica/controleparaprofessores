// ============================================================
// Assinatura do professor (tabela `subscriptions`, somente
// leitura pelo cliente) + chamadas às Edge Functions do Asaas.
// ============================================================
import { db } from '../config/supabase.js';

export async function fetchMySubscription(userId){
  const { data, error } = await db.from('subscriptions').select('*').eq('user_id', userId).single();
  if(error) throw error;
  return {
    status: data.status,
    planValue: data.plan_value,
    updatedAt: data.updated_at,
  };
}

export async function startSubscription(){
  const { data, error } = await db.functions.invoke('asaas-create-subscription');
  if(error) throw error;
  return data; // { checkoutUrl, subscriptionId }
}

export async function cancelSubscription(){
  const { data, error } = await db.functions.invoke('asaas-cancel-subscription');
  if(error) throw error;
  return data;
}
