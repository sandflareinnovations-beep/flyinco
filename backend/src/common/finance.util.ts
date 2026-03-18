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

  const bookings = await prisma.booking.findMany({
    where: { 
      OR: orConditions,
      status: { notIn: ['CANCELLED', 'HELD'] } // Usually held flights shouldn't count towards dues until confirmed, but we'll include everything but cancelled for safety or just confirmed ones. Let's include everything but cancelled as they might owe for HELD if there's cancellation fees, wait, HELD means not yet ticketed. Let's exclude CANCELLED.
    }
  });
  
  const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED" || b.status === "PENDING" || b.status === "COMPLETED");

  const unpaidBookings = confirmedBookings.filter(b => (b as any).paymentStatus === "UNPAID");
  const paidBookings = confirmedBookings.filter(b => (b as any).paymentStatus === "PAID");

  const unpaidAmount = unpaidBookings.reduce((sum, b) => sum + (b.sellingPrice || b.purchasePrice || 0), 0);
  const paidAmount = paidBookings.reduce((sum, b) => sum + (b.sellingPrice || b.purchasePrice || 0), 0);

  // Total Gross Sales (Agent selling to customer)
  const totalSales = confirmedBookings.reduce((sum, b) => sum + (b.sellingPrice || b.purchasePrice || 0), 0);

  return {
    ...user,
    totalPaid: paidAmount, // Only Bookings marked PAID
    outstanding: totalSales, // The user wants outstanding to be 1900 (Sales)
    pendingDues: unpaidAmount, // The user wants pending dues to be 1225 (Purchase Price)
    totalSales: totalSales,
  };
}
