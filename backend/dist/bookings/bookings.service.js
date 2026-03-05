"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingsService = class BookingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, userId) {
        const route = await this.prisma.route.findUnique({
            where: { id: dto.routeId }
        });
        if (!route) {
            throw new common_1.NotFoundException('Route not found');
        }
        if (route.remainingSeats <= 0) {
            throw new common_1.BadRequestException('No remaining seats');
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
                status: (dto.transactionId || dto.paymentReceipt) ? 'PENDING' : 'HELD',
            },
            include: { route: true }
        });
        await this.prisma.route.update({
            where: { id: dto.routeId },
            data: {
                remainingSeats: route.remainingSeats - 1,
            }
        });
        return booking;
    }
    async findAll(user) {
        if (user.role === 'ADMIN') {
            return this.prisma.booking.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    route: true,
                    user: { select: { id: true, name: true, email: true, phone: true } }
                },
            });
        }
        else {
            return this.prisma.booking.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                include: { route: true },
            });
        }
    }
    async findOne(id, user) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: { route: true }
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (user.role !== 'ADMIN' && booking.userId !== user.id) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return booking;
    }
    async update(id, dto) {
        return this.prisma.booking.update({
            where: { id },
            data: dto,
            include: { route: true }
        });
    }
    async remove(id) {
        return this.prisma.booking.delete({ where: { id } });
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map