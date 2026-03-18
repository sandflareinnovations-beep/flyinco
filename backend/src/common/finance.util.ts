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
  
  // Include HELD? The user said "HOW MANY BOOKING ARE EACH AGENT DID AND PAID OR DUE". Usually held bookings don't generate dues until Confirmed. Let's stick to CONFIRMED and PENDING.
  const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED" || b.status === "PENDING" || b.status === "COMPLETED");

  const payments = await prisma.payment.findMany({
    where: { agentId: user.id }
  });

  const bookingsOwed = confirmedBookings.reduce((sum, b) => sum + (b.purchasePrice || 0), 0);
  const manualDues = payments.reduce((sum, p) => sum + (p.type === 'DUES' ? (p.amount || 0) : 0), 0);
  const totalPaidAmt = payments.reduce((sum, p) => sum + (p.type === 'PAYMENT' ? (p.amount || 0) : 0), 0);

  const totalOwed = bookingsOwed + manualDues;
  const pendingDues = totalOwed - totalPaidAmt;

  return {
    ...user,
    totalPaid: totalPaidAmt,
    outstanding: totalOwed,
    pendingDues: pendingDues > 0 ? pendingDues : 0,
  };
}
