// ============================================================
// Verifica a assinatura do Auth Hook do Supabase (padrão
// "Standard Webhooks"), para garantir que a chamada realmente
// veio do Supabase Auth e não de terceiros.
// Segredo gerado pelo Supabase ao configurar o hook, no formato
// "v1,whsec_XXXXXXXXXXXXXXXX".
// ============================================================
export async function verifyAuthHook(req: Request, rawBody: string, secret: string): Promise<boolean> {
  if (!secret) return false;

  const id = req.headers.get('webhook-id') ?? '';
  const timestamp = req.headers.get('webhook-timestamp') ?? '';
  const signatureHeader = req.headers.get('webhook-signature') ?? '';
  if (!id || !timestamp || !signatureHeader) return false;

  const secretKey = secret.replace(/^v1,/, '').replace(/^whsec_/, '');
  const keyBytes = base64ToBytes(secretKey);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const signatureBytes = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(signedContent));
  const expected = bytesToBase64(new Uint8Array(signatureBytes));

  // webhook-signature pode trazer mais de uma assinatura, ex: "v1,abc== v1,def=="
  return signatureHeader
    .split(' ')
    .map((s) => s.replace(/^v1,/, ''))
    .some((sig) => sig === expected);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
