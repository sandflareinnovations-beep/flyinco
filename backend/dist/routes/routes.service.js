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
exports.RoutesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RoutesService = class RoutesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
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
    async findOne(id) {
        const route = await this.prisma.route.findUnique({ where: { id } });
        if (!route)
            throw new common_1.NotFoundException('Route not found');
        return route;
    }
    async update(id, dto) {
        const updateData = { ...dto };
        if (dto.departureDate) {
            updateData.departureDate = new Date(dto.departureDate);
        }
        return this.prisma.route.update({
            where: { id },
            data: updateData,
        });
    }
    async updateBookingStatus(id, status) {
        return this.prisma.route.update({
            where: { id },
            data: { bookingStatus: status },
        });
    }
    async remove(id) {
        await this.prisma.booking.deleteMany({ where: { routeId: id } });
        return this.prisma.route.delete({ where: { id } });
    }
};
exports.RoutesService = RoutesService;
exports.RoutesService = RoutesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoutesService);
//# sourceMappingURL=routes.service.js.map