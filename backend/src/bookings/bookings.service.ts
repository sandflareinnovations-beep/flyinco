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

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

  async bulkImport(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Use { header: 1 } to get raw arrays and then find the header row
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
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

    for (const row of data as any[]) {
      try {
        // Handle variations in column names from the provided file
        const prefix = row['PREFIX'] || row['prefix'] || '';
        const givenName = row['GIVEN NAME '] || row['givenName'] || row['Passenger Name'] || row['passengerName'] || '';
        const surname = row[' SURNAME'] || row['surname'] || '';
        
        const passengerName = `${prefix} ${givenName} ${surname}`.trim().replace(/\s+/g, ' ');

        const passportNumber = String(row['PASSPORT NUMBER'] || row['passportNumber'] || row['Passport Number'] || '');
        
        let pnr = String(row['PNR'] || row['pnr'] || '');
        let refNo = String(row['Ref No'] || row['referenceNumber'] || '');
        let agentDetails = String(row['Agent'] || row['agent'] || row['AGENT'] || row['Agent Details'] || row['Agent Name'] || row['AGENT DETAILS'] || '');

        // Overrides for the specific charter file
        if (isCharterFormat) {
          pnr = '7EAMRW';
          refNo = 'FLRUHCOKMAR18SV';
        }

        const purchasePrice = parseFloat(row['NET PRICE'] || row['netPrice'] || row['Purchase Price'] || row['purchasePrice'] || 0);
        const sellingPrice = parseFloat(row['SELLING PRICE'] || row['sellingPrice'] || row['Selling Price'] || 0);
        
        // Status mapping
        let status = row['STATUS'] || row['status'] || 'CONFIRMED';
        if (typeof status === 'string' && status.includes('TICKET COPY GIVEN')) status = 'CONFIRMED';

        // Route ID handling
        let routeId = row['Route ID'] || row['routeId'];
        
        if (!routeId) {
          // If no Route ID, try to find a route
          let route = await this.prisma.route.findFirst({ 
            where: isCharterFormat ? { flightNumber: { contains: '3650' } } : {},
            orderBy: { createdAt: 'desc' }
          });

          if (!route && isCharterFormat) {
            // Create the charter route if it doesn't exist
            route = await this.prisma.route.create({
              data: {
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
                price: 0,
                isCharter: true,
                bookingStatus: 'CLOSED' // Hide from home screen
              }
            });
          }

          if (route) {
            routeId = route.id;
          }
        }

        if (!routeId) throw new Error('Route ID is missing and no default route found');
        if (!passengerName || passengerName === 'undefined' || passengerName === ' ') throw new Error('Passenger Name is missing');

        const profit = sellingPrice - purchasePrice;

        await this.prisma.booking.create({
          data: {
            routeId,
            passengerName,
            passportNumber,
            email: String(row['Email'] || row['email'] || ''),
            phone: String(row['Phone'] || row['phone'] || ''),
            status,
            pnr,
            refNo,
            ticketNumber: String(row['Ticket Number'] || row['ticketNumber'] || ''),
            purchasePrice,
            sellingPrice,
            profit,
            agentDetails,
            isNew: true, // Mark as NEW for admin panel
          },
        });

        // Update route capacity - skip for charter format as per user request
        if (!isCharterFormat && (status === 'CONFIRMED' || status === 'PENDING')) {
          await this.prisma.route.update({
            where: { id: routeId },
            data: { remainingSeats: { decrement: 1 } },
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ row, error: error.message });
      }
    }

    return results;
  }

  async create(dto: CreateBookingDto, userId: string | null) {
    const route = await this.prisma.route.findUnique({
      where: { id: dto.routeId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    if (route.remainingSeats <= 0) {
      throw new BadRequestException('No remaining seats');
    }

    const booking = await this.prisma.booking.create({
      data: {
        userId: userId || undefined,
        routeId: dto.routeId,
        passengerName: dto.passengerName,
        passportNumber: dto.passportNumber,
        email: dto.email,
        phone: dto.phone,
        transactionId: dto.transactionId,
        paymentReceipt: dto.paymentReceipt,
        status: dto.transactionId || dto.paymentReceipt ? 'PENDING' : 'HELD',
        purchasePrice: dto.purchasePrice || 0,
        sellingPrice: dto.sellingPrice || route.price,
        profit: (dto.sellingPrice || route.price) - (dto.purchasePrice || 0),
        baseFare: dto.baseFare || 0,
        taxes: dto.taxes || 0,
        serviceFee: dto.serviceFee || 0,
        pnr: dto.pnr,
        ticketNumber: dto.ticketNumber,
      },
      include: { route: true },
    });

    await this.prisma.route.update({
      where: { id: dto.routeId },
      data: {
        remainingSeats: route.remainingSeats - 1,
      },
    });

    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user && user.role === 'AGENT') {
        const owedAmount = dto.purchasePrice || 0;
        if (owedAmount > 0) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              pendingDues: { increment: owedAmount },
              outstanding: { increment: owedAmount }
            }
          });
        }
      }
    }

    await this.mailService.sendBookingConfirmation(
      booking.email,
      booking.id
    );

    return booking;
  }

  async findAll(user: any) {
    if (user.role === 'ADMIN') {
      return this.prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          route: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
    } else {
      return this.prisma.booking.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { route: true },
      });
    }
  }

  async findOne(id: string, user: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { route: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (user.role !== 'ADMIN' && booking.userId !== user.id) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async update(id: string, dto: UpdateBookingDto) {
    const current = await this.prisma.booking.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Booking not found');

    const purchasePrice = dto.purchasePrice !== undefined ? dto.purchasePrice : current.purchasePrice;
    const sellingPrice = dto.sellingPrice !== undefined ? dto.sellingPrice : current.sellingPrice;
    const profit = (sellingPrice || 0) - (purchasePrice || 0);

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...dto,
        profit: profit,
      },
      include: { route: true },
    });
  }

  async remove(id: string) {
    // Optionally restore seats here
    return this.prisma.booking.delete({ where: { id } });
  }

  async removeMany(ids: string[]) {
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
          <p style="margin: 4px 0 0; font-size: 10px; color: #94a3b8;">&copy; 2024 Flyinco Travel Management Company. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.mailService.sendItineraryEmail(email, booking.passengerName, itineraryHtml);

    return { success: true, message: `Itinerary sent to ${email}` };
  }
}
