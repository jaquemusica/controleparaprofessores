// ============================================================
// Cliente mínimo da API do Asaas. Lê a chave e o ambiente
// (sandbox/produção) das variáveis de ambiente da função —
// nunca do código-fonte.
// ============================================================
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') ?? '';
const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') ?? 'https://sandbox.asaas.com/api/v3';

if (!ASAAS_API_KEY) {
  console.error('ASAAS_API_KEY não configurada nas variáveis de ambiente da função.');
}

export async function asaasFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.errors?.[0]?.description || `Asaas respondeu ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
