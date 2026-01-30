import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: { amount: number; description?: string; metadata?: any }) {
    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      throw new BadRequestException('Amount must be positive integer (kopeks)');
    }

    const order = await this.prisma.order.create({
      data: {
        amount: params.amount,
        description: params.description,
        metadata: params.metadata,
        status: OrderStatus.NEW
      }
    });

    return order;
  }

  async getById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
