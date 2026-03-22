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
                  paymentStatus: { in: ['UNPAID', 'PENDING'] },
                  status: { in: ['CONFIRMED', 'PENDING', 'HELD', 'COMPLETED'] }
              },
              orderBy: { createdAt: 'asc' },
              select: { id: true, sellingPrice: true },
              take: 1000 // Large enough for most payments but bounded for speed
          });

          const idsToMarkPaid: string[] = [];
          let amountLeft = payment.amount;
          for (const b of unpaidBookings) {
              const price = b.sellingPrice || 0;
              if (price > 0 && amountLeft >= (price - 0.01)) { // handle tiny float diffs
                  idsToMarkPaid.push(b.id);
                  amountLeft -= price;
              }
              if (amountLeft <= 0) break;
          }

          if (idsToMarkPaid.length > 0) {
              await this.prisma.booking.updateMany({
                  where: { id: { in: idsToMarkPaid } },
                  data: { paymentStatus: 'PAID' }
              });
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
                orderBy: { createdAt: 'desc' },
                select: { id: true, sellingPrice: true },
                take: 1000
            });

            const idsToRevert: string[] = [];
            let remainingToRevert = payment.amount;
            for (const b of matchingPaidBookings) {
                const price = b.sellingPrice || 0;
                if (remainingToRevert >= (price - 0.01)) {
                    idsToRevert.push(b.id);
                    remainingToRevert -= price;
                }
                if (remainingToRevert <= 0) break;
            }

            if (idsToRevert.length > 0) {
                await this.prisma.booking.updateMany({
                    where: { id: { in: idsToRevert } },
                    data: { paymentStatus: 'UNPAID' }
                });
            }
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
