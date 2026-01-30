import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('/v1/orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  async create(@Body() body: { amount: number; description?: string; metadata?: any }) {
    return this.orders.create({
      amount: body.amount,
      description: body.description,
      metadata: body.metadata
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.orders.getById(id);
  }
}
