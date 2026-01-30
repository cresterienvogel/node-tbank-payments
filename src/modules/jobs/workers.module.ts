import { Module } from '@nestjs/common';
import { JobsModule } from './jobs.module';
import { PaymentsModule } from '../payments/payments.module';
import { OutboxModule } from '../outbox/outbox.module';
import { WebhookProcessor } from './processors/webhook.processor';
import { OutboxProcessor } from './processors/outbox.processor';

@Module({
  imports: [JobsModule, PaymentsModule, OutboxModule],
  providers: [WebhookProcessor, OutboxProcessor]
})

export class WorkersModule {}
