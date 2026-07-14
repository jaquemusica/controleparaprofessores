// ============================================================
// Cabeçalhos CORS compartilhados por todas as Edge Functions
// chamadas diretamente pelo navegador (create-subscription,
// cancel-subscription). O webhook do Asaas não passa por aqui
// (servidor-a-servidor, sem CORS).
// ============================================================
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
