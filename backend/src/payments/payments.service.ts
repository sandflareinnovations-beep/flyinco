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

  findAll() {
    return this.prisma.payment.findMany({
      include: { agent: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  findByAgent(agentId: string) {
    return this.prisma.payment.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
