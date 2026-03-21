import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: any) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }

  // Supplier Payments
  @Post('supplier')
  createSupplierPayment(@Body() data: any) {
    return this.paymentsService.createSupplierPayment(data);
  }

  @Get('supplier/:name')
  findBySupplier(@Param('name') name: string) {
    return this.paymentsService.findBySupplier(name);
  }

  @Delete('supplier/:id')
  removeSupplierPayment(@Param('id') id: string) {
    return this.paymentsService.removeSupplierPayment(id);
  }
}
