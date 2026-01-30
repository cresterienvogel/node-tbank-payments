import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OutboxService } from '../../outbox/outbox.service';
import { JobsService } from '../queues';

@Processor('outbox')
export class OutboxProcessor extends WorkerHost {
  constructor(
    private readonly outbox: OutboxService,
    private readonly jobs: JobsService
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    if (job.name !== 'outbox.dispatch') return;

    const { outboxEventId } = job.data as { outboxEventId: string };
    const res = await this.outbox.dispatchOnce(outboxEventId);

    if (!res.ok && res.retryInMs) {
      await this.jobs.enqueueOutboxDispatch(outboxEventId, res.retryInMs);
    }

    return res;
  }
}
