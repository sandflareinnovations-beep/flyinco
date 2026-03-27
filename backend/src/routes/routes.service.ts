import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRouteDto } from "./dto/create-route.dto";
import { UpdateRouteDto } from "./dto/update-route.dto";

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRouteDto) {
    const data: any = {
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
      airlineLogo: dto.airlineLogo,
      layover: dto.layover,
      flightRules: dto.flightRules,
      flightDetails: dto.flightDetails,
      supplier: dto.supplier,
    };

    if (dto.arrivalDate && dto.arrivalDate !== "") {
      const date = new Date(dto.arrivalDate);
      if (!isNaN(date.getTime())) {
        data.arrivalDate = date;
      }
    }

    return this.prisma.route.create({ data });
  }

  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      availableOnly?: boolean;
    } = {},
  ) {
    const { page = 1, limit = 50, search = "", availableOnly = false } = query;
    const skip = (page - 1) * limit;
    const take = Number(limit);

    const where: any = {};

    if (availableOnly) {
      where.bookingStatus = "OPEN";
      where.remainingSeats = { gt: 0 };
    }

    if (search) {
      where.OR = [
        { origin: { contains: search, mode: "insensitive" } },
        { destination: { contains: search, mode: "insensitive" } },
        { airline: { contains: search, mode: "insensitive" } },
        { flightNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [routes, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        skip,
        take: limit === -1 ? undefined : take, // Support fetching all if limit is -1
        orderBy: { departureDate: "asc" },
        include: {
          _count: {
            select: {
              bookings: {
                where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
              },
            },
          },
        },
      }),
      this.prisma.route.count({ where }),
    ]);

    // Second pass: get held counts (Prisma doesn't support multiple _count filters in one query)
    const routeIds = routes.map((r: any) => r.id);
    const heldCounts = await this.prisma.booking.groupBy({
      by: ["routeId"],
      where: {
        routeId: { in: routeIds },
        status: { in: ["HELD", "PENDING"] },
      },
      _count: { id: true },
    });
    const heldMap = new Map(
      heldCounts.map((h) => [h.routeId, h._count.id]),
    );

    const mappedRoutes = routes.map((r: any) => ({
      ...r,
      soldSeats: r._count?.bookings ?? 0,
      heldSeats: heldMap.get(r.id) ?? 0,
      _count: undefined, // Clean up internal field
    }));

    return { routes: mappedRoutes, total, page, limit };
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException("Route not found");
    return route;
  }

  async update(id: string, dto: UpdateRouteDto) {
    const updateData: any = { ...dto };
    if (dto.departureDate) {
      const date = new Date(dto.departureDate);
      if (!isNaN(date.getTime())) {
        updateData.departureDate = date;
      }
    }
    if (dto.arrivalDate !== undefined) {
      if (dto.arrivalDate === "" || dto.arrivalDate === null) {
        updateData.arrivalDate = null;
      } else {
        const date = new Date(dto.arrivalDate);
        if (!isNaN(date.getTime())) {
          updateData.arrivalDate = date;
        }
      }
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

  async removeMany(ids: string[]) {
    // Delete associated bookings first
    await this.prisma.booking.deleteMany({ where: { routeId: { in: ids } } });
    return this.prisma.route.deleteMany({ where: { id: { in: ids } } });
  }
}
