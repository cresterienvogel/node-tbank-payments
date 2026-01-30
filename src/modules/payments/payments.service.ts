import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TbankService } from '../tbank/tbank.service';
import { JobsService } from '../jobs/queues';
import { OutboxService } from '../outbox/outbox.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { sha256Hex } from '../../common/utils/crypto';
import { normalizeProviderStatus, canTransition } from '../../common/utils/status-machine';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tbank: TbankService,
    private readonly outbox: OutboxService,
    private readonly jobs: JobsService
  ) {}

  async createPaymentForOrder(params: {
    orderId: string;
    description?: string;
    idempotencyKey?: string;
  }) {
    const order = await this.prisma.order.findUnique({ where: { id: params.orderId } });
    if (!order) throw new NotFoundException('order not found');

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('order already paid');
    }

    if (params.idempotencyKey && params.idempotencyKey.trim().length > 0) {
      const key = params.idempotencyKey.trim();
      const reqHash = sha256Hex(
        JSON.stringify({
          orderId: params.orderId,
          description: params.description ?? ''
        })
      );

      const existed = await this.prisma.idempotencyKey.findUnique({ where: { key } });
      if (existed) {
        if (existed.requestHash !== reqHash) {
          throw new BadRequestException('Idempotency-Key reuse with different payload');
        }
        return existed.response;
      }

      const result = await this.createPaymentInternal(order.id, params.description);

      await this.prisma.idempotencyKey.create({
        data: {
          key,
          requestHash: reqHash,
          response: result as any
        }
      });

      return result;
    }

    return this.createPaymentInternal(order.id, params.description);
  }

  private async createPaymentInternal(orderId: string, description?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('order not found');

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.amount,
        status: PaymentStatus.NEW
      }
    });

    const init = await this.tbank.initPayment({
      orderId: order.id,
      amount: order.amount,
      description: description ?? order.description ?? undefined
    });

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: init.providerPaymentId,
        payUrl: init.payUrl,
        rawInitResponse: init.raw as any
      }
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PENDING_PAYMENT }
    });

    return {
      orderId: order.id,
      paymentId: updated.id,
      providerPaymentId: updated.providerPaymentId,
      payUrl: updated.payUrl
    };
  }

  async getPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true, history: true }
    });

    if (!payment) throw new NotFoundException('payment not found');
    return payment;
  }

  async cancel(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('payment not found');
    if (!payment.providerPaymentId) throw new BadRequestException('payment not initialized');

    const res = await this.tbank.cancel(payment.providerPaymentId);
    return { ok: true, provider: res };
  }

  async sync(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('payment not found');
    if (!payment.providerPaymentId) throw new BadRequestException('payment not initialized');

    const state = await this.tbank.getState(payment.providerPaymentId);

    if (!state.Success) {
      return { ok: false, provider: state };
    }

    const applied = await this.applyProviderStatus({
      providerPaymentId: payment.providerPaymentId,
      incomingStatusRaw: state.Status,
      rawPayload: { source: 'sync', provider: state }
    });

    return { ok: true, provider: state, applied };
  }

  async applyProviderStatus(params: {
    providerPaymentId: string;
    incomingStatusRaw: unknown;
    rawPayload: any;
  }) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerPaymentId: params.providerPaymentId }
    });

    if (!payment) {
      return { applied: false, reason: 'payment not found yet' };
    }

    const incoming = normalizeProviderStatus(params.incomingStatusRaw);

    if (!canTransition(payment.status, incoming)) {
      return {
        applied: false,
        reason: 'transition rejected',
        current: payment.status,
        incoming
      };
    }

    let outboxEventId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentStatusHistory.create({
        data: {
          paymentId: payment.id,
          from: payment.status,
          to: incoming,
          raw: params.rawPayload as any
        }
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: incoming }
      });

      if (incoming === PaymentStatus.CONFIRMED) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.PAID }
        });

        const ev = await this.outbox.createEventTx(tx, {
          type: 'ORDER_PAID',
          payload: {
            orderId: payment.orderId,
            paymentId: payment.id,
            providerPaymentId: payment.providerPaymentId,
            amount: payment.amount
          }
        });

        outboxEventId = ev.id;
      }
    });

    if (outboxEventId) {
      await this.jobs.enqueueOutboxDispatch(outboxEventId);
    }

    return { applied: true, incoming };
  }
}