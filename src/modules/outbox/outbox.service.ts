import { Injectable } from '@nestjs/common';
import { Prisma, OutboxStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { hmacSha256Hex } from '../../common/utils/crypto';

@Injectable()
export class OutboxService {
  private readonly callbackUrl: string;
  private readonly hmacSecret?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    this.callbackUrl = this.config.get<string>('AFTER_PAYMENT_CALLBACK_URL')!;
    this.hmacSecret = this.config.get<string>('CALLBACK_HMAC_SECRET') || undefined;
  }

  async createEventTx(
    tx: Prisma.TransactionClient,
    params: { type: string; payload: any }
  ) {
    return tx.outboxEvent.create({
      data: {
        type: params.type,
        payload: params.payload as any,
        status: OutboxStatus.PENDING
      }
    });
  }

  async getById(id: string) {
    return this.prisma.outboxEvent.findUnique({ where: { id } });
  }

  async dispatchOnce(outboxEventId: string): Promise<{ ok: boolean; retryInMs?: number; error?: string }> {
    const ev = await this.prisma.outboxEvent.findUnique({ where: { id: outboxEventId } });
    if (!ev) return { ok: false, error: 'not found' };
    if (ev.status === OutboxStatus.SENT) return { ok: true };

    const payload = {
      type: ev.type,
      eventId: ev.id,
      createdAt: ev.createdAt.toISOString(),
      data: ev.payload
    };

    const body = JSON.stringify(payload);

    const headers: Record<string, string> = {
      'content-type': 'application/json'
    };

    if (this.hmacSecret && this.hmacSecret.length > 0) {
      headers['x-signature'] = hmacSha256Hex(this.hmacSecret, body);
    }

    try {
      const r = await fetch(this.callbackUrl, { method: 'POST', headers, body });
      if (!r.ok) throw new Error(`callback non-2xx: ${r.status}`);

      await this.prisma.outboxEvent.update({
        where: { id: ev.id },
        data: { status: OutboxStatus.SENT, lastError: null }
      });

      return { ok: true };
    } catch (e: any) {
      const attempts = ev.attempts + 1;
      const retryInMs = Math.min(60_000, 1000 * Math.pow(2, attempts));

      await this.prisma.outboxEvent.update({
        where: { id: ev.id },
        data: {
          status: OutboxStatus.FAILED,
          attempts,
          lastError: String(e?.message ?? e)
        }
      });

      return { ok: false, retryInMs, error: String(e?.message ?? e) };
    }
  }
}
