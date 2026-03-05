import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateRouteDto) {
        return this.prisma.route.create({
            data: {
                origin: dto.origin,
                originCity: dto.originCity,
                destination: dto.destination,
                destinationCity: dto.destinationCity,
                price: dto.price,
                totalSeats: dto.totalSeats,
                remainingSeats: dto.totalSeats,
                departureDate: new Date(dto.departureDate),
                airline: dto.airline,
                flightNumber: dto.flightNumber,
                departureTime: dto.departureTime,
                arrivalTime: dto.arrivalTime,
                baggage: dto.baggage,
                duration: dto.duration,
            },
        });
    }

    async findAll() {
        return this.prisma.route.findMany({
            orderBy: { departureDate: 'asc' },
        });
    }

    async findOne(id: string) {
        const route = await this.prisma.route.findUnique({ where: { id } });
        if (!route) throw new NotFoundException('Route not found');
        return route;
    }

    async update(id: string, dto: UpdateRouteDto) {
        const updateData: any = { ...dto };
        if (dto.departureDate) {
            updateData.departureDate = new Date(dto.departureDate);
        }

        return this.prisma.route.update({
            where: { id },
            data: updateData,
        });
    }

    async updateBookingStatus(id: string, status: string) {
        return this.prisma.route.update({
            where: { id },
            data: { bookingStatus: status },
        });
    }

    async remove(id: string) {
        // First delete associated bookings to prevent foreign key constraint errors
        await this.prisma.booking.deleteMany({ where: { routeId: id } });
        return this.prisma.route.delete({ where: { id } });
    }
}
