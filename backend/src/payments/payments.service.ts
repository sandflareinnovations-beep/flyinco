import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findByAgent(agentId: string) {
    return this.prisma.payment.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' }
    });
  }

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

      // --- AUTO-ALLOCATION: Mark UNPAID bookings as PAID (FIFO) ---
      const agentUser = await this.prisma.user.findUnique({ where: { id: data.agentId } });
      if (agentUser) {
          const names = [agentUser.name, agentUser.agencyName].filter(Boolean);
          const bookingConditions: any[] = [{ userId: agentUser.id }];
          names.forEach(n => {
              bookingConditions.push({ agentDetails: { contains: n, mode: 'insensitive' } });
          });

          const unpaidBookings = await this.prisma.booking.findMany({
              where: {
                  OR: bookingConditions,
                  paymentStatus: 'UNPAID',
                  status: { not: 'CANCELLED' }
              },
              orderBy: { createdAt: 'asc' }
          });

          let amountLeft = payment.amount;
          for (const b of unpaidBookings) {
              const price = b.sellingPrice || 0;
              if (price > 0 && amountLeft >= price) {
                  await this.prisma.booking.update({
                      where: { id: b.id },
                      data: { paymentStatus: 'PAID' }
                  });
                  amountLeft -= price;
              }
              if (amountLeft <= 0) break;
          }
      }
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
        const agentUser = await this.prisma.user.findUnique({ where: { id: payment.agentId } });
        const bookingsToRevert: any[] = [];
        if (agentUser) {
            const names = [agentUser.name, agentUser.agencyName].filter(Boolean);
            const bookingConditions: any[] = [{ userId: agentUser.id }];
            names.forEach(n => {
                bookingConditions.push({ agentDetails: { contains: n, mode: 'insensitive' } });
            });

            const matchingPaidBookings = await this.prisma.booking.findMany({
                where: {
                    OR: bookingConditions,
                    paymentStatus: 'PAID',
                    status: { not: 'CANCELLED' }
                },
                orderBy: { createdAt: 'desc' }
            });
            bookingsToRevert.push(...matchingPaidBookings);
        }

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
