import { PrismaService } from '../prisma/prisma.service';

export async function calculateAgentFinances(prisma: PrismaService, user: any) {
  if (!user || user.role !== 'AGENT') return user;

  const agentName = user.name || '';
  const agencyName = user.agencyName || '';

  const orConditions: any[] = [{ userId: user.id }];
  if (agentName.trim()) {
    orConditions.push({ agentDetails: { contains: agentName.trim(), mode: 'insensitive' } });
  }
  if (agencyName.trim()) {
    orConditions.push({ agentDetails: { contains: agencyName.trim(), mode: 'insensitive' } });
  }

  // Use a targeted aggregate to avoid fetching thousands of records
  const [totalAgg, paidAgg, unpaidAgg] = await Promise.all([
    prisma.booking.aggregate({
      where: { 
        OR: orConditions,
        status: { in: ['CONFIRMED', 'PENDING', 'COMPLETED'] }
      },
      _sum: { sellingPrice: true, purchasePrice: true }
    }),
    prisma.booking.aggregate({
      where: { 
        OR: orConditions,
        status: { in: ['CONFIRMED', 'PENDING', 'COMPLETED'] },
        paymentStatus: 'PAID'
      },
      _sum: { sellingPrice: true, purchasePrice: true }
    }),
    prisma.booking.aggregate({
      where: { 
        OR: orConditions,
        status: { in: ['CONFIRMED', 'PENDING', 'COMPLETED'] },
        paymentStatus: 'UNPAID'
      },
      _sum: { sellingPrice: true, purchasePrice: true }
    })
  ]);

  const totalSales = totalAgg._sum.sellingPrice || totalAgg._sum.purchasePrice || 0;
  const paidAmount = paidAgg._sum.sellingPrice || paidAgg._sum.purchasePrice || 0;
  const unpaidAmount = unpaidAgg._sum.sellingPrice || unpaidAgg._sum.purchasePrice || 0;

  return {
    ...user,
    totalPaid: paidAmount,
    outstanding: totalSales,
    pendingDues: unpaidAmount,
    totalSales: totalSales,
  };
}
