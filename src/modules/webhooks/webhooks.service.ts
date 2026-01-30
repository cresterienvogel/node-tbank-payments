import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { computeTbankToken } from '../../common/utils/crypto';
import { JobsService } from '../jobs/queues';

@Injectable()
export class WebhooksService {
  private readonly password: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService
  ) {
    this.password = this.config.get<string>('TBANK_PASSWORD')!;
  }

  async acceptTbankWebhook(payload: any): Promise<void> {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('invalid payload');
    }

    const token = payload.Token;
    if (typeof token !== 'string' || token.length < 10) {
      throw new BadRequestException('Token missing');
    }

    const expected = computeTbankToken(payload, this.password);
    if (expected !== token) {
      throw new BadRequestException('Invalid Token');
    }

    const providerPaymentId = String(payload.PaymentId ?? '');
    const status = payload.Status;

    if (!providerPaymentId) {
      throw new BadRequestException('PaymentId missing');
    }

    const dedupeKey = `${providerPaymentId}:${String(status ?? '')}:${String(payload.TransId ?? '')}:${String(payload.EventTime ?? '')}`;

    try {
      await this.prisma.webhookEvent.create({
        data: {
          provider: 'tbank',
          dedupeKey,
          raw: payload as any
        }
      });
    } catch {
      return;
    }

    await this.jobs.enqueueWebhook({
      providerPaymentId,
      status,
      raw: payload
    });
  }
}
