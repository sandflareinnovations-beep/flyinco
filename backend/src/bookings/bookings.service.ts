import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { MailService } from '../mail/mail.service';
import * as XLSX from 'xlsx';
import * as FileType from 'file-type';
import { Logger } from '@nestjs/common';

function parseDateHelper(d: any): Date | undefined {
  if (!d) return undefined;
  const date = new Date(d);
  if (isNaN(date.getTime())) return undefined;
  return date;
}

function sanitizeCell(val: any): string {
  if (typeof val !== 'string') return String(val || '');
  // Prevent CSV/Excel formula injection (Cells starting with =, +, -, @)
  const trimmed = val.trim();
  if (['=', '+', '-', '@'].some(char => trimmed.startsWith(char))) {
    return `'${trimmed}`; // Prepends a single quote to neutralize formula
  }
  return trimmed;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

  async bulkImport(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    // --- MAGIC BYTES CHECK (Audit Point 9) ---
    const type = await FileType.fromBuffer(file.buffer);
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!type || !allowedTypes.includes(type.mime)) {
      throw new BadRequestException('Invalid file format. Only true Excel files (.xlsx, .xls) are permitted.');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Use { header: 1 } to get raw arrays and then find the header row
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // --- ROW LIMIT (Audit Point 9) ---
    if (rawRows.length > 1000) {
      throw new BadRequestException('Bulk import limited to 1000 rows per file for system stability.');
    }
    
    // Find the row that contains 'SL NO' or 'PNR'
    let headerRowIndex = -1;
    let isCharterFormat = false;

    // Check row 0 for charter markers
    if (rawRows[0] && rawRows[0].some(cell => typeof cell === 'string' && cell.includes('MARCH') && cell.includes('SV-3650'))) {
      isCharterFormat = true;
    }

    for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
      if (rawRows[i].includes('SL NO') || rawRows[i].includes('PNR') || rawRows[i].includes('GIVEN NAME ')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new BadRequestException('Could not find header row in Excel file. Please ensure columns like "PNR" or "GIVEN NAME" exist.');
    }

    // Convert to JSON starting from the header row
    const data = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });

    const results: { success: number; failed: number; errors: any[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const parseExcelDate = (val: any): Date | null => {
      if (!val) return null;
      if (!isNaN(Number(val))) {
        // Excel numbers are days since Dec 30, 1899
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + Number(val) * 86400000);
      }
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    let rowIndex = headerRowIndex + 2; 
    for (const row of data as any[]) {
      let passengerName = 'Unknown';
      let pnr = '';
      try {
        const nr: any = {};
        for (const k in row) {
          nr[k.trim().toUpperCase()] = row[k];
        }

        const prefix = nr['PREFIX'] || '';
        const givenName = nr['GIVEN NAME'] || nr['PASSENGER NAME'] || nr['PASSENGERNAME'] || nr['NAME'] || '';
        const surname = nr['SURNAME'] || '';
        
        passengerName = `${prefix} ${givenName} ${surname}`.trim().replace(/\s+/g, ' ');
        if (!passengerName || passengerName === 'Unknown') passengerName = 'Unknown';

        const gender = String(nr['GENDER'] || '');
        const nationality = String(nr['NATIONALITY'] || '');
        const dob = parseExcelDate(nr['D.O.B PAX'] || nr['DOB'] || nr['DATE OF BIRTH']);
        const passportExpiry = parseExcelDate(nr['PP EXPAIRY'] || nr['PASSPORT EXPIRY'] || nr['EXPIRY']);
        const passportNumber = String(nr['PASSPORT'] || nr['PASSPORT NUMBER'] || nr['PASSPORT NO'] || nr['PP NO'] || '');
        
        pnr = String(nr['PNR'] || nr['PNR NO'] || nr['PNR '] || nr['CONFIRMATION'] || '');
        let refNo = String(nr['REF NO'] || nr['REFERENCE NUMBER'] || nr['REFERENCE'] || '');
        let agentDetails = String(nr['AGENT'] || nr['AGENT DETAILS'] || nr['AGENT NAME'] || nr['AGENTS'] || nr['AGENCY'] || nr['AGENCY NAME'] || nr['BOOKED BY'] || '');

        if (isCharterFormat) {
          pnr = '7EAMRW';
          refNo = 'FLRUHCOKMAR18SV';
        }

        const purchasePrice = parseFloat(nr['NET PRICE'] || nr['PURCHASE PRICE'] || nr['NETPRICE'] || 0);
        const sellingPrice = parseFloat(nr['SELLING PRICE'] || nr['SALE PRICE'] || nr['SELLINGPRICE'] || 0);
        
        const airline = sanitizeCell(nr['AIRLINES'] || nr['AIRLINE'] || nr['CARRIER'] || '');
        const sector = sanitizeCell(nr['SECTOR'] || nr['ROUTE'] || '');
        const travelDate = parseExcelDate(nr['TRAVEL DATE'] || nr['FLIGHT DATE'] || nr['DATE'] || nr['DEPARTURE DATE']);
        
        const supplier = sanitizeCell(nr['SUPPLYER'] || nr['SUPPLIER'] || nr['SOURCE'] || '');
        const agencyEmail = sanitizeCell(nr['AGENCY EMAIL ID'] || nr['AGENCY EMAIL'] || nr['EMAIL'] || nr['EMAIL ID'] || '');
        const paymentStatus = sanitizeCell(nr['PAYMENT STATUS'] || 'UNPAID');
        const paymentMethod = sanitizeCell(nr['PAYMENT METHOD'] || nr['CASH OR BANK TRANSFER'] || '');
        const requestField = sanitizeCell(nr['REQUEST'] || '');
        const remarksField = sanitizeCell(nr['REMARKS'] || nr['REMARK'] || '');
        
        let status = sanitizeCell(nr['STATUS'] || 'CONFIRMED');
        if (typeof status === 'string' && status.includes('TICKET COPY GIVEN')) status = 'CONFIRMED';

        let routeId = row['Route ID'] || row['routeId'];
        if (!routeId) {
          // Robust Route Detection: Find by sector (contains origin-destination) and airline
          const sectorStr = (sector || '').toLowerCase();
          const parts = sectorStr.includes('-') ? sectorStr.split('-') : sectorStr.split(' ');
          const originPart = parts[0]?.trim();
          const destPart = parts[1]?.trim();

          const route = await this.prisma.route.findFirst({
            where: {
              AND: [
                (originPart || destPart) ? {
                  OR: [
                    originPart ? { origin: { contains: originPart, mode: 'insensitive' as const } } : undefined,
                    destPart ? { destination: { contains: destPart, mode: 'insensitive' as const } } : undefined,
                  ].filter(Boolean) as any
                } : {},
                airline ? { airline: { contains: airline, mode: 'insensitive' as const } } : {},
                isCharterFormat ? { flightNumber: { contains: '3650' } } : {}
              ]
            },
            orderBy: { createdAt: 'desc' }
          });
          if (route) {
            routeId = route.id;
          } else if (isCharterFormat) {
            // Fallback for Charter as before
            const charter = await this.prisma.route.upsert({
              where: { id: 'default-charter' },
              update: {},
              create: {
                id: 'default-charter',
                origin: 'RUH',
                originCity: 'Riyadh',
                destination: 'COK',
                destinationCity: 'Kochi',
                departureDate: new Date('2026-03-18T00:00:00Z'),
                arrivalDate: new Date('2026-03-19T00:00:00Z'),
                departureTime: '19:15',
                arrivalTime: '03:15',
                flightNumber: 'SV 3650 (Charter Flight)',
                airline: 'Saudi Airlines',
                totalSeats: 42,
                remainingSeats: 42,
                price: 750,
                isCharter: true,
                bookingStatus: 'CLOSED'
              }
            });
            routeId = charter.id;
          }
        }

        if (!routeId) throw new Error('Route ID is missing and no default route found');
        if (!passengerName || passengerName === 'Unknown' || passengerName === ' ') throw new Error('Passenger Name is missing');
        if (!passportNumber || passportNumber === 'undefined' || passportNumber === '') throw new Error('Passport Number is missing');
        if (!pnr || pnr === 'undefined' || pnr === '') throw new Error('PNR is missing');
        if (!travelDate) throw new Error('Travel Date is missing or invalid format');
        if (isNaN(sellingPrice) || sellingPrice <= 0) throw new Error('Selling Price is missing or invalid');
        if (!agentDetails || agentDetails === 'undefined' || agentDetails === '') throw new Error('Agent details are missing (Required for Agent Dashboard)');

        const profit = sellingPrice - purchasePrice;

        const b = await this.prisma.booking.create({
          data: {
            routeId,
            passengerName,
            prefix,
            givenName,
            surname,
            gender,
            nationality,
            dateOfBirth: dob,
            passportExpiry,
            airline,
            sector,
            travelDate: travelDate || undefined,
            supplier,
            agencyEmail,
            paymentMethod,
            request: requestField,
            remarks: remarksField,
            passportNumber,
            email: String(row['Email'] || row['email'] || ''),
            phone: String(row['Phone'] || row['phone'] || ''),
            status,
            paymentStatus,
            pnr,
            refNo,
            ticketNumber: String(row['Ticket Number'] || row['ticketNumber'] || ''),
            purchasePrice,
            sellingPrice,
            profit,
            agentDetails,
            isNew: true,
          },
        });

        // Financial Sync: Upate agent user balance if matched
        if (agentDetails) {
          const matchedAgent = await this.prisma.user.findFirst({
            where: { OR: [{ name: agentDetails }, { agencyName: agentDetails }] }
          });
          if (matchedAgent && matchedAgent.role === 'AGENT' && (paymentStatus === 'UNPAID' || !paymentStatus)) {
            await this.prisma.user.update({
              where: { id: matchedAgent.id },
              data: {
                pendingDues: { increment: sellingPrice || 0 },
                outstanding: { increment: sellingPrice || 0 },
                totalSales: { increment: sellingPrice || 0 }
              }
            });
          }
        }

        if (!isCharterFormat && (status === 'CONFIRMED' || status === 'PENDING')) {
          await this.prisma.route.update({
            where: { id: routeId },
            data: { remainingSeats: { decrement: 1 } },
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ 
          row: rowIndex, 
          identifier: passengerName !== 'Unknown' ? passengerName : (pnr ? `PNR: ${pnr}` : 'Unnamed Row'),
          error: error.message 
        });
      }
      rowIndex++;
    }


    return results;
  }

  async create(dto: CreateBookingDto, user: any) {
    const route = await this.prisma.route.findUnique({
      where: { id: dto.routeId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    if (route.remainingSeats <= 0) {
      throw new BadRequestException('No remaining seats');
    }

    // SECURITY AUDIT FIX: Only admin can set custom prices or purchase costs.
    // Regular users MUST use the route's current price.
    const isAdmin = user?.role === 'ADMIN';
    const sellingPrice = isAdmin ? (dto.sellingPrice || route.price) : route.price;
    const purchasePrice = isAdmin ? (dto.purchasePrice || 0) : 0;
    const profit = sellingPrice - purchasePrice;

    // Automatic Agent Details Mapping:
    // If agent is logged in, use their agency name or name.
    let effectiveAgentDetails = dto.agentDetails;
    // Robust Agent Identification & Details Mapping:
    let structuredAgentDetails = dto.agentDetails || '';
    if (user?.id) {
        const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser && dbUser.role === 'AGENT') {
            const agency = (dbUser.agencyName || dbUser.name || 'Direct Agent').trim();
            const person = (dbUser.name || 'Unknown').trim();
            // Unified identification format for cross-system mapping
            structuredAgentDetails = `${agency} (${person})`;
        } else if (dbUser && !structuredAgentDetails) {
            // Logged in passenger without agent association
            structuredAgentDetails = (dbUser.name || 'Direct Passenger').trim();
        }
    } else {
        this.logger.warn(`UNAUTHENTICATED BOOKING ATTEMPT for ${dto.passengerName} (email: ${dto.email}). Expected a user object but none found.`);
    }

    this.logger.log(`Booking Processing: ${dto.email} [Identified Agent: ${structuredAgentDetails}]`);

    // Atomic Booking Transaction (Strict Seat count protection)
    const booking = await this.prisma.$transaction(async (tx) => {
      // 1. Availability check inside the atomic operation
      const r = await tx.route.findFirst({ where: { id: dto.routeId } });
      if (!r || r.remainingSeats <= 0) throw new BadRequestException('Flight is fully booked (No seats left)');

      // 2. Create the Booking entry
      const b = await tx.booking.create({
        data: {
          userId: user?.id || null,
          routeId: dto.routeId,
          passengerName: dto.passengerName,
          passportNumber: dto.passportNumber,
          email: dto.email,
          phone: dto.phone,
          transactionId: dto.transactionId,
          paymentReceipt: dto.paymentReceipt,
          status: (dto.transactionId || dto.paymentReceipt || dto.paymentMethod === 'CREDIT') ? 'PENDING' : 'HELD',
          purchasePrice,
          sellingPrice,
          profit,
          baseFare: Number(dto.baseFare || 0),
          taxes: Number(dto.taxes || 0),
          serviceFee: Number(dto.serviceFee || 0),
          pnr: dto.pnr,
          ticketNumber: dto.ticketNumber,
          prefix: dto.prefix,
          givenName: dto.givenName,
          surname: dto.surname,
          airline: dto.airline,
          sector: dto.sector,
          travelDate: parseDateHelper(dto.travelDate),
          supplier: dto.supplier,
          agencyEmail: dto.agencyEmail,
          paymentMethod: dto.paymentMethod,
          remarks: dto.remarks,
          request: dto.request,
          agentDetails: structuredAgentDetails,
          gender: dto.gender,
          nationality: dto.nationality,
          dateOfBirth: parseDateHelper(dto.dateOfBirth),
          passportExpiry: parseDateHelper(dto.passportExpiry),
        },
        include: { route: true },
      });

      // 3. Update Inventory (Decrement seat atomicially)
      await tx.route.update({
        where: { id: dto.routeId },
        data: { remainingSeats: { decrement: 1 } },
      });

      return b;
    });

    this.logger.log(`Booking Finalized: ${booking.id} [Mapped Agent: ${booking.agentDetails}]`);

    // Financial Sync for Manual Bookings
    if (effectiveAgentDetails) {
      const matchedAgent = await this.prisma.user.findFirst({
        where: { OR: [{ name: { equals: effectiveAgentDetails, mode: 'insensitive' } }, { agencyName: { equals: effectiveAgentDetails, mode: 'insensitive' } }] }
      });
      if (matchedAgent && matchedAgent.role === 'AGENT') {
        const owedAmount = sellingPrice || 0;
        if (owedAmount > 0) {
          await this.prisma.user.update({
            where: { id: matchedAgent.id },
            data: {
              pendingDues: { increment: owedAmount },
              outstanding: { increment: owedAmount },
              totalSales: { increment: owedAmount }
            }
          });
          this.logger.log(`Financial Sync: Incremented dues/sales for agent ${matchedAgent.name} by SAR ${owedAmount}`);
        }
      }
    } else if (user?.id) {
      const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
      if (dbUser && dbUser.role === 'AGENT') {
        const owedAmount = sellingPrice || 0;
        if (owedAmount > 0) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              pendingDues: { increment: owedAmount },
              outstanding: { increment: owedAmount },
              totalSales: { increment: owedAmount }
            }
          });
          this.logger.log(`Financial Sync: Incremented dues/sales for logged-in agent ${dbUser.name} by SAR ${owedAmount}`);
        }
      }
    } else {
        this.logger.warn(`CRITICAL: Booking ${booking.id} created but no agent/user attribution was possible.`);
    }

    await this.mailService.sendBookingConfirmation(
      booking.email,
      booking.id
    );

    return booking;
  }

  async findAll(user: any, query: { page?: number; limit?: number; search?: string; agent?: string; phone?: string; supplier?: string } = {}) {
    const { page = 1, limit = 50, search = '', agent = '', phone = '', supplier = '' } = query;
    const skip = (page - 1) * limit;
    const take = Number(limit);

    const where: any = {};

    if (user.role === 'ADMIN') {
      // Use AND array to combine conditions without overwriting
      const andConditions: any[] = [];

      if (search) {
        andConditions.push({
          OR: [
            { passengerName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { pnr: { contains: search, mode: 'insensitive' } },
            { passportNumber: { contains: search, mode: 'insensitive' } },
            { refNo: { contains: search, mode: 'insensitive' } },
            { ticketNumber: { contains: search, mode: 'insensitive' } },
            { agentDetails: { contains: search, mode: 'insensitive' } },
            { route: { origin: { contains: search, mode: 'insensitive' } } },
            { route: { destination: { contains: search, mode: 'insensitive' } } },
          ]
        });
      }

      if (agent) {
        // Find the agent user record to get ALL possible identifiers
        const agentUser = await this.prisma.user.findFirst({
          where: { OR: [
            { name: { contains: agent, mode: 'insensitive' } },
            { agencyName: { contains: agent, mode: 'insensitive' } }
          ]}
        });

        const agentOrConditions: any[] = [
          { agentDetails: { contains: agent, mode: 'insensitive' } },
        ];

        // If we matched a user, also search by their other identifiers and userId
        if (agentUser) {
          agentOrConditions.push({ userId: agentUser.id });
          if (agentUser.name && agentUser.name.toLowerCase() !== agent.toLowerCase()) {
            agentOrConditions.push({ agentDetails: { contains: agentUser.name, mode: 'insensitive' } });
          }
          if (agentUser.agencyName && agentUser.agencyName.toLowerCase() !== agent.toLowerCase()) {
            agentOrConditions.push({ agentDetails: { contains: agentUser.agencyName, mode: 'insensitive' } });
          }
        }

        andConditions.push({ OR: agentOrConditions });
      }

      if (phone) {
        andConditions.push({ phone: { contains: phone, mode: 'insensitive' } });
      }

      if (supplier) {
        andConditions.push({ supplier: { contains: supplier, mode: 'insensitive' } });
      }

      if (andConditions.length > 0) {
        where.AND = andConditions;
      }

      const [bookings, total] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            route: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        }),
        this.prisma.booking.count({ where }),
      ]);

      return { bookings, total, page, limit };
    } else if (user.role === 'AGENT') {
      const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } });
      const agentName = (fullUser?.name || '').trim();
      const agencyName = (fullUser?.agencyName || '').trim();
      const agentEmail = (fullUser?.email || '').trim();

      const agentConditions: any[] = [{ userId: user.id }];
      
      if (agentName) {
        agentConditions.push({ agentDetails: { contains: agentName, mode: 'insensitive' } });
      }
      if (agencyName) {
        agentConditions.push({ agentDetails: { contains: agencyName, mode: 'insensitive' } });
      }
      if (agentEmail) {
        agentConditions.push({ agencyEmail: { contains: agentEmail, mode: 'insensitive' } });
        agentConditions.push({ agentDetails: { contains: agentEmail, mode: 'insensitive' } });
      }

      // Initialize conditions
      const andArr: any[] = [];
      andArr.push({ OR: agentConditions });

      if (search) {
        andArr.push({
          OR: [
            { passengerName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { pnr: { contains: search, mode: 'insensitive' } },
            { ticketNumber: { contains: search, mode: 'insensitive' } },
            { route: { origin: { contains: search, mode: 'insensitive' } } },
            { route: { destination: { contains: search, mode: 'insensitive' } } },
          ]
        });
      }

      where.AND = andArr;

      const [bookings, total] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { route: true },
        }),
        this.prisma.booking.count({ where }),
      ]);

      return { bookings, total, page, limit };
    } else {
      where.userId = user.id;
      if (search) {
        where.OR = [
          { passengerName: { contains: search, mode: 'insensitive' } },
          { pnr: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [bookings, total] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { route: true },
        }),
        this.prisma.booking.count({ where }),
      ]);

      return { bookings, total, page, limit };
    }
  }

  async getSuppliers() {
    const bookings = await this.prisma.booking.findMany({
      select: { supplier: true },
      where: { NOT: { supplier: null } },
      distinct: ['supplier'],
    });

    return bookings
      .map((b) => b.supplier)
      .filter((s) => s && s.trim() !== '')
      .sort();
  }

  async getMetrics(user: any) {
    const where: any = {};
    if (user.role === 'AGENT') {
      const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } });
      const agentName = (fullUser?.name || '').trim();
      const agencyName = (fullUser?.agencyName || '').trim();
      const agentEmail = (fullUser?.email || '').trim();

      const agentConditions: any[] = [{ userId: user.id }];
      if (agentName) agentConditions.push({ agentDetails: { contains: agentName, mode: 'insensitive' } });
      if (agencyName) agentConditions.push({ agentDetails: { contains: agencyName, mode: 'insensitive' } });
      if (agentEmail) {
        agentConditions.push({ agencyEmail: { contains: agentEmail, mode: 'insensitive' } });
        agentConditions.push({ agentDetails: { contains: agentEmail, mode: 'insensitive' } });
      }
      where.OR = agentConditions;
    } else if (user.role === 'USER') {
      where.userId = user.id;
    }

    const [allBookings, counts, allPayments] = await Promise.all([
      this.prisma.booking.findMany({
        where: { ...where, status: { not: 'CANCELLED' } },
        select: {
          sellingPrice: true,
          purchasePrice: true,
          profit: true,
          status: true,
          agentDetails: true,
          paymentStatus: true,
          route: { select: { price: true } }
        }
      }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: { _all: true }
      }),
      this.prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        include: { agent: { select: { id: true, name: true, agencyName: true } } }
      })
    ]);

    const activeFinancials = allBookings.filter(b => b.status !== 'CANCELLED');
    const totalRevenue = activeFinancials.reduce((acc, b) => acc + (b.sellingPrice || b.route?.price || 0), 0);
    const totalProfit = activeFinancials.reduce((acc, b) => {
      // If profit is specifically 0 but we have prices, the profit field might be out of date
      const p = (b.profit !== 0 && b.profit !== null && b.profit !== undefined) 
                ? b.profit 
                : ( (b.sellingPrice || b.route?.price || 0) - (b.purchasePrice || 0) );
      return acc + p;
    }, 0);
    const totalBookings = counts.reduce((acc, s) => acc + s._count._all, 0);
    
    const statusCounts = counts.reduce((acc, s) => {
      acc[s.status] = s._count._all;
      return acc;
    }, {} as Record<string, number>);

    const globalPaymentsSum = allPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalUnpaidDues = Math.max(0, totalRevenue - globalPaymentsSum);

    const agentMap: Record<string, { totalSales: number; profit: number; count: number; unpaid: number }> = {};
    activeFinancials.forEach(b => {
      const agent = (b.agentDetails || 'Direct').trim();
      if (!agentMap[agent]) agentMap[agent] = { totalSales: 0, profit: 0, count: 0, unpaid: 0 };
      
      const sale = (b.sellingPrice || b.route?.price || 0);
      const p = (b.profit !== 0 && b.profit !== null && b.profit !== undefined) 
                ? b.profit 
                : (sale - (b.purchasePrice || 0));
                
      agentMap[agent].totalSales += sale;
      agentMap[agent].profit += p;
      agentMap[agent].count += 1;
      agentMap[agent].unpaid += sale; // Initialize unpaid with total sales
    });

    // Subtract payments from agentMap unpaid using multiple key combinations
    allPayments.forEach(p => {
      const dbAgentName = (p.agent?.name || '').trim();
      const dbAgencyName = (p.agent?.agencyName || '').trim();
      const identifier = `${dbAgencyName || 'Direct Agent'} (${dbAgentName || 'Unknown'})`;
      
      const keys = [identifier, dbAgentName, dbAgencyName].filter(Boolean);
      for (const key of keys) {
        if (agentMap[key]) {
          agentMap[key].unpaid -= (p.amount || 0);
          break;
        }
      }
    });

    // Ensure unpaid doesn't go below 0
    Object.values(agentMap).forEach(stats => {
      stats.unpaid = Math.max(0, stats.unpaid);
    });

    const agentPerformance = Object.entries(agentMap)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .filter(a => a.name !== 'Direct') // Only show actual agents if possible
      .slice(0, 10);

    return {
      totalRevenue,
      totalProfit,
      totalBookings,
      totalUnpaidDues,
      agentPerformance,
      heldCount: statusCounts['HELD'] || 0,
      confirmedCount: statusCounts['CONFIRMED'] || 0,
      pendingCount: statusCounts['PENDING'] || 0,
      cancelledCount: statusCounts['CANCELLED'] || 0,
    };
  }

  async findOne(id: string, user: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { route: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (user.role !== 'ADMIN') {
      if (booking.userId !== user.id) {
        if (user.role === 'AGENT') {
          const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } });
          const agentName = (fullUser?.name || '').toLowerCase();
          const agencyName = (fullUser?.agencyName || '').toLowerCase();
          const details = (booking.agentDetails || '').toLowerCase();
          
          const matchName = agentName && details.includes(agentName);
          const matchAgency = agencyName && details.includes(agencyName);
          
          if (!matchName && !matchAgency) {
            throw new NotFoundException('Booking not found');
          }
        } else {
          throw new NotFoundException('Booking not found');
        }
      }
    }

    return booking;
  }

  async update(id: string, dto: UpdateBookingDto) {
    const current = await this.prisma.booking.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Booking not found');

    const purchasePrice = dto.purchasePrice !== undefined ? dto.purchasePrice : current.purchasePrice;
    const sellingPrice = dto.sellingPrice !== undefined ? dto.sellingPrice : current.sellingPrice;
    const profit = (sellingPrice || 0) - (purchasePrice || 0);

    // Seat Management on Status Change
    if (dto.status && dto.status !== current.status) {
      if (dto.status === 'CANCELLED') {
        // Just got cancelled, release seat
        await this.prisma.route.update({
          where: { id: current.routeId },
          data: { remainingSeats: { increment: 1 } },
        }).catch(() => {});
      } else if (current.status === 'CANCELLED') {
        // Was cancelled, now restored, re-consume seat
        await this.prisma.route.update({
          where: { id: current.routeId },
          data: { remainingSeats: { decrement: 1 } },
        }).catch(() => {});
      }
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...dto,
        profit: profit,
        travelDate: parseDateHelper(dto.travelDate),
        dateOfBirth: parseDateHelper(dto.dateOfBirth),
        passportExpiry: parseDateHelper(dto.passportExpiry),
      },
      include: { route: true },
    });
  }

  async remove(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

    // Restore seat count if booking was not cancelled
    if (booking.status !== 'CANCELLED') {
      await this.prisma.route.update({
        where: { id: booking.routeId },
        data: { remainingSeats: { increment: 1 } },
      }).catch(() => {}); // Ignore if route was deleted
    }

    return this.prisma.booking.delete({ where: { id } });
  }

  async removeMany(ids: string[]) {
    // SECURITY AUDIT: Restoring seats for bulk delete
    const bookings = await this.prisma.booking.findMany({
      where: { id: { in: ids } }
    });

    for (const b of bookings) {
      if (b.status !== 'CANCELLED') {
        await this.prisma.route.update({
          where: { id: b.routeId },
          data: { remainingSeats: { increment: 1 } }
        }).catch(() => {});
      }
    }

    return this.prisma.booking.deleteMany({
      where: { id: { in: ids } }
    });
  }

  async sendTicketToCustomer(bookingId: string, file: Express.Multer.File) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    await this.mailService.sendTicketEmail(
      booking.email,
      file.buffer
    );

    return { message: "Ticket sent successfully" };
  }

  async sendItinerary(bookingId: string, customEmail?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { route: true }
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const email = customEmail || booking.email;
    const route = booking.route;

    const itineraryHtml = `
      <div style="font-family: 'Inter', sans-serif; color: #1e1a4b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #1e1a4b;">FLYINCO TRAVEL MANAGEMENT COMPANY</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Itinerary Confirmation</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 4px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Passenger Name</p>
            <p style="margin: 0; font-size: 16px; font-weight: 900; text-transform: uppercase;">${booking.passengerName}</p>
          </div>

          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 900; color: #1e1a4b;">${route.origin} &rarr; ${route.destination}</span>
              <span style="font-size: 11px; font-weight: 900; color: #059669;">CONFIRMED</span>
            </div>
            
            <table width="100%" style="font-size: 12px;">
              <tr>
                <td style="padding: 4px 0;"><span style="color: #64748b;">Flight:</span> <b>${route.flightNumber}</b></td>
                <td style="padding: 4px 0;"><span style="color: #64748b;">Airline:</span> <b>${route.airline}</b></td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><span style="color: #64748b;">Departure:</span> <b>${route.departureTime} (${new Date(route.departureDate).toLocaleDateString()})</b></td>
                <td style="padding: 4px 0;"><span style="color: #64748b;">Arrival:</span> <b>${route.arrivalTime}</b></td>
              </tr>
            </table>
          </div>

          <div style="display: flex; gap: 12px;">
            <div style="flex: 1; background-color: #f0f4ff; padding: 12px; border-radius: 8px; border: 1px solid #dbeafe; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 9px; font-weight: 900; color: #3b82f6; text-transform: uppercase;">PNR / Reservation</p>
              <p style="margin: 0; font-size: 18px; font-weight: 900; font-family: monospace;">${booking.pnr || 'PENDING'}</p>
            </div>
            ${booking.ticketNumber && booking.ticketNumber !== 'NOT ISSUED' ? `
            <div style="flex: 1; background-color: #f0f4ff; padding: 12px; border-radius: 8px; border: 1px solid #dbeafe; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 9px; font-weight: 900; color: #3b82f6; text-transform: uppercase;">Ticket Number</p>
              <p style="margin: 0; font-size: 18px; font-weight: 900; font-family: monospace;">${booking.ticketNumber}</p>
            </div>
            ` : ''}
          </div>

          ${booking.refNo ? `
          <div style="margin-top: 16px; padding: 8px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0 0 2px; font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase;">FLYINCO REF NO</p>
            <p style="margin: 0; font-size: 12px; font-weight: 900; letter-spacing: 2px;">${booking.refNo}</p>
          </div>
          ` : ''}
        </div>

        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #64748b;">Need help? Contact us at <b>info@flyinco.com</b></p>
          <p style="margin: 4px 0 0; font-size: 10px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Flyinco Travel Management Company. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.mailService.sendItineraryEmail(email, booking.passengerName, itineraryHtml);

    return { success: true, message: `Itinerary sent to ${email}` };
  }
}
