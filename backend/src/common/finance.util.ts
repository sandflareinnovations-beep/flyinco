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
  const [totalAgg, manualPaymentsAgg] = await Promise.all([
    prisma.booking.aggregate({
      where: { 
        OR: orConditions,
        status: { in: ['CONFIRMED', 'PENDING', 'COMPLETED'] }
      },
      _sum: { sellingPrice: true, purchasePrice: true }
    }),
    prisma.payment.aggregate({
      where: { agentId: user.id, status: 'COMPLETED' },
      _sum: { amount: true }
    })
  ]);

  const totalSales = totalAgg._sum.sellingPrice || totalAgg._sum.purchasePrice || 0;
  const manualPaid = manualPaymentsAgg._sum.amount || 0;
  const unpaidAmount = totalSales - manualPaid;

  return {
    ...user,
    totalPaid: manualPaid,
    outstanding: totalSales,
    pendingDues: Math.max(0, unpaidAmount),
    totalSales: totalSales,
  };
}
