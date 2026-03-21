import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const payment = await this.prisma.payment.create({ data });
    if (data.type === 'PAYMENT' && payment.status === 'COMPLETED') {
      await this.prisma.user.update({
        where: { id: data.agentId },
        data: {
          totalPaid: { increment: payment.amount },
          pendingDues: { decrement: payment.amount }
        }
      });
    } else if (data.type === 'DUES' && payment.status === 'COMPLETED') {
      await this.prisma.user.update({
        where: { id: data.agentId },
        data: {
          pendingDues: { increment: payment.amount },
          outstanding: { increment: payment.amount }
        }
      });
    }
    return payment;
  }

  async remove(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) return;

    if (payment.type === 'PAYMENT') {
        // Find bookings that were marked PAID using this amount (FIFO or manual)
        // Since we don't have a direct link table yet, we find recently paid bookings for this agent
        const bookingsToRevert = await this.prisma.booking.findMany({
            where: {
                agentDetails: { contains: (await this.prisma.user.findUnique({where:{id: payment.agentId}}))?.name || '', mode: 'insensitive' },
                paymentStatus: 'PAID',
                status: { not: 'CANCELLED' }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Revert up to the amount deleted
        let remainingToRevert = payment.amount;
        for (const b of bookingsToRevert) {
            const price = b.sellingPrice || 0;
            if (remainingToRevert >= price) {
                await this.prisma.booking.update({ where: { id: b.id }, data: { paymentStatus: 'UNPAID' } });
                remainingToRevert -= price;
            }
            if (remainingToRevert <= 0) break;
        }

        await this.prisma.user.update({
            where: { id: payment.agentId },
            data: {
                totalPaid: { decrement: payment.amount },
                pendingDues: { increment: payment.amount }
            }
        });
    }

    return this.prisma.payment.delete({ where: { id } });
  }

  // --- Supplier Payments ---
  createSupplierPayment(data: any) {
    return this.prisma.supplierPayment.create({ data });
  }

  findBySupplier(name: string) {
    return this.prisma.supplierPayment.findMany({
      where: { supplierName: name },
      orderBy: { createdAt: 'desc' }
    });
  }

  removeSupplierPayment(id: string) {
    return this.prisma.supplierPayment.delete({ where: { id } });
  }
}
