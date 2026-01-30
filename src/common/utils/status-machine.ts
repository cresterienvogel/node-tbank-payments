import { PaymentStatus } from '@prisma/client';

const RANK: Record<PaymentStatus, number> = {
  NEW: 0,
  FORM_SHOWED: 1,
  AUTHORIZING: 2,
  AUTHORIZED: 3,
  CONFIRMED: 4,
  CANCELED: 5,
  REJECTED: 5,
  UNKNOWN: -1
};

export function normalizeProviderStatus(statusRaw: unknown): PaymentStatus {
  if (typeof statusRaw !== 'string') return PaymentStatus.UNKNOWN;

  const s = statusRaw.toUpperCase().trim();

  if (s === 'NEW') return PaymentStatus.NEW;
  if (s === 'FORM_SHOWED') return PaymentStatus.FORM_SHOWED;
  if (s === 'AUTHORIZING') return PaymentStatus.AUTHORIZING;
  if (s === 'AUTHORIZED') return PaymentStatus.AUTHORIZED;
  if (s === 'CONFIRMED') return PaymentStatus.CONFIRMED;
  if (s === 'CANCELED') return PaymentStatus.CANCELED;
  if (s === 'REJECTED') return PaymentStatus.REJECTED;

  return PaymentStatus.UNKNOWN;
}

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  if (to === PaymentStatus.UNKNOWN) return false;
  if (from === to) return false;

  const final = new Set<PaymentStatus>([
    PaymentStatus.CONFIRMED,
    PaymentStatus.CANCELED,
    PaymentStatus.REJECTED
  ]);

  if (final.has(from)) return false;
  return RANK[to] >= RANK[from];
}
