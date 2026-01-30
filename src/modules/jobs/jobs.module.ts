import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { JobsService } from './queues';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') }
      })
    }),
    BullModule.registerQueue({ name: 'webhooks' }, { name: 'outbox' })
  ],
  providers: [JobsService],
  exports: [JobsService, BullModule]
})

export class JobsModule {}
