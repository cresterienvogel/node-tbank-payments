import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
    @InjectQueue('outbox') private readonly outboxQueue: Queue
  ) {}

  async enqueueWebhook(data: { providerPaymentId: string; status: unknown; raw: any }) {
    await this.webhooksQueue.add('tbank.webhook', data, {
      attempts: 10,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true
    });
  }

  async enqueueOutboxDispatch(outboxEventId: string, delayMs = 0) {
    await this.outboxQueue.add('outbox.dispatch', { outboxEventId }, {
      delay: delayMs,
      attempts: 10,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true
    });
  }
}
