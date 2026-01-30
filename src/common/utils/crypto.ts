import { createHash, createHmac } from 'crypto';

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function hmacSha256Hex(secret: string, input: string): string {
  return createHmac('sha256', secret).update(input, 'utf8').digest('hex');
}

export function computeTbankToken(payload: Record<string, unknown>, password: string): string {
  const flat: Record<string, string> = {};

  for (const [k, v] of Object.entries(payload)) {
    if (k === 'Token') continue;
    if (v === null || v === undefined) continue;

    const t = typeof v;
    if (t === 'string' || t === 'number' || t === 'boolean') {
      flat[k] = String(v);
    }
  }

  flat['Password'] = password;

  const keys = Object.keys(flat).sort((a, b) => a.localeCompare(b));
  const concatenated = keys.map((k) => flat[k]).join('');

  return sha256Hex(concatenated);
}
