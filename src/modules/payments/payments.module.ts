import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TbankModule } from '../tbank/tbank.module';
import { JobsModule } from '../jobs/jobs.module';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [TbankModule, OutboxModule, JobsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService]
})

export class PaymentsModule {}
