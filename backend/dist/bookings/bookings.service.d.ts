import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
export declare class BookingsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateBookingDto, userId: string | null): Promise<{
        route: {
            origin: string;
            destination: string;
            price: number;
            totalSeats: number;
            departureDate: Date;
            airline: string;
            flightNumber: string;
            departureTime: string;
            arrivalTime: string;
            baggage: string;
            duration: string;
            originCity: string;
            destinationCity: string;
            remainingSeats: number;
            id: string;
            bookingStatus: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        routeId: string;
        passengerName: string;
        passportNumber: string;
        email: string;
        phone: string;
        transactionId: string | null;
        paymentReceipt: string | null;
        status: string;
        userId: string | null;
    }>;
    findAll(user: any): Promise<({
        route: {
            origin: string;
            destination: string;
            price: number;
            totalSeats: number;
            departureDate: Date;
            airline: string;
            flightNumber: string;
            departureTime: string;
            arrivalTime: string;
            baggage: string;
            duration: string;
            originCity: string;
            destinationCity: string;
            remainingSeats: number;
            id: string;
            bookingStatus: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        routeId: string;
        passengerName: string;
        passportNumber: string;
        email: string;
        phone: string;
        transactionId: string | null;
        paymentReceipt: string | null;
        status: string;
        userId: string | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        route: {
            origin: string;
            destination: string;
            price: number;
            totalSeats: number;
            departureDate: Date;
            airline: string;
            flightNumber: string;
            departureTime: string;
            arrivalTime: string;
            baggage: string;
            duration: string;
            originCity: string;
            destinationCity: string;
            remainingSeats: number;
            id: string;
            bookingStatus: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        routeId: string;
        passengerName: string;
        passportNumber: string;
        email: string;
        phone: string;
        transactionId: string | null;
        paymentReceipt: string | null;
        status: string;
        userId: string | null;
    }>;
    update(id: string, dto: UpdateBookingDto): Promise<{
        route: {
            origin: string;
            destination: string;
            price: number;
            totalSeats: number;
            departureDate: Date;
            airline: string;
            flightNumber: string;
            departureTime: string;
            arrivalTime: string;
            baggage: string;
            duration: string;
            originCity: string;
            destinationCity: string;
            remainingSeats: number;
            id: string;
            bookingStatus: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        routeId: string;
        passengerName: string;
        passportNumber: string;
        email: string;
        phone: string;
        transactionId: string | null;
        paymentReceipt: string | null;
        status: string;
        userId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        routeId: string;
        passengerName: string;
        passportNumber: string;
        email: string;
        phone: string;
        transactionId: string | null;
        paymentReceipt: string | null;
        status: string;
        userId: string | null;
    }>;
}
