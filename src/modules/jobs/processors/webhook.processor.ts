import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PaymentsService } from '../../payments/payments.service';

@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  constructor(private readonly payments: PaymentsService) {
    super();
  }

  async process(job: Job): Promise<any> {
    if (job.name !== 'tbank.webhook') return;

    const data = job.data as { providerPaymentId: string; status: unknown; raw: any };

    return this.payments.applyProviderStatus({
      providerPaymentId: data.providerPaymentId,
      incomingStatusRaw: data.status,
      rawPayload: data.raw
    });
  }
}
