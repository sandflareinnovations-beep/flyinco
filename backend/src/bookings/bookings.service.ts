import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

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
      },
      include: { route: true },
    });

    await this.prisma.route.update({
      where: { id: dto.routeId },
      data: {
        remainingSeats: route.remainingSeats - 1,
      },
    });

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
    return this.prisma.booking.update({
      where: { id },
      data: dto,
      include: { route: true },
    });
  }

  async remove(id: string) {
    // Optionally restore seats here
    return this.prisma.booking.delete({ where: { id } });
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
}
