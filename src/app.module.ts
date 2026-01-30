import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './common/config/env.validation';
import { PrismaModule } from './common/prisma/prisma.module';

import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { TbankModule } from './modules/tbank/tbank.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { WorkersModule } from './modules/jobs/workers.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { DemoModule } from './modules/demo/demo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    JobsModule,
    WorkersModule,
    TbankModule,
    OutboxModule,
    OrdersModule,
    PaymentsModule,
    WebhooksModule,
    DemoModule
  ]
})

export class AppModule {}
