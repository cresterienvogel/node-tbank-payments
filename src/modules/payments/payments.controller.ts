import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('/v1')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('/orders/:orderId/payments')
  async createPayment(
    @Param('orderId') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: { description?: string }
  ) {
    return this.payments.createPaymentForOrder({
      orderId,
      description: body.description,
      idempotencyKey: idempotencyKey
    });
  }

  @Get('/payments/:paymentId')
  async get(@Param('paymentId') paymentId: string) {
    return this.payments.getPayment(paymentId);
  }

  @Post('/payments/:paymentId/sync')
  async sync(@Param('paymentId') paymentId: string) {
    return this.payments.sync(paymentId);
  }

  @Post('/payments/:paymentId/cancel')
  async cancel(@Param('paymentId') paymentId: string) {
    return this.payments.cancel(paymentId);
  }
}
