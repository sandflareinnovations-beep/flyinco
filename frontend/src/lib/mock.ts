import { RouteOption, FlightOption, FareSector, Booking } from './types';
import { subDays } from 'date-fns';

const today = new Date();

// ─── Original Fare Sectors ─────────────────────────────────────────────────
export const mockSectors: FareSector[] = [
    {
        id: 's1',
        originCode: 'RUH',
        originCity: 'Riyadh',
        destinationCode: 'COK',
        destinationCity: 'Cochin',
        price: 24500,
        totalSeats: 150,
        remainingSeats: 45,
        heldSeats: 10,
        soldSeats: 95,
        departureTime: '11:35 AM',
        arrivalTime: '06:50 PM',
        airline: 'Saudia Airlines',
        flightNumber: 'SV 890',
        duration: '7h 15m',
        departureDate: '09 MARCH',
        baggage: '2PC BAGGAGE',
    }
];

export const mockBookings: Booking[] = [
    {
        id: 'b1',
        sectorId: 's1',
        passengerName: 'Mohammed Ali',
        passportNumber: 'A12345678',
        nationality: 'Saudi Arabia',
        phone: '+966500000000',
        email: 'mohammed@example.com',
        status: 'CONFIRMED',
        farePrice: 24500,
        createdAt: subDays(today, 2).toISOString(),
        route: 'RUH - COK',
    }
];

// ─── Special Fare Routes ───────────────────────────────────────────────────
export const mockRoutes: RouteOption[] = [
    {
        id: 'r1',
        originCode: 'JED',
        originCity: 'Jeddah',
        destinationCode: 'CCJ',
        destinationCity: 'Kozhikode',
        airline: 'SalamAir',
        departureDate: '2026-03-08',
        arrivalDate: '2026-03-09',
        price: 1300,
        totalSeats: 50,
        remainingSeats: 3,
    },
    {
        id: 'r2',
        originCode: 'JED',
        originCity: 'Jeddah',
        destinationCode: 'COK',
        destinationCity: 'Kochi',
        airline: 'Saudia Airlines',
        departureDate: '2026-03-10',
        arrivalDate: '2026-03-10',
        price: 1450,
        totalSeats: 80,
        remainingSeats: 12,
    },
    {
        id: 'r3',
        originCode: 'RUH',
        originCity: 'Riyadh',
        destinationCode: 'CCJ',
        destinationCity: 'Kozhikode',
        airline: 'IndiGo',
        departureDate: '2026-03-09',
        arrivalDate: '2026-03-09',
        price: 1200,
        totalSeats: 60,
        remainingSeats: 8,
    },
    {
        id: 'r4',
        originCode: 'DXB',
        originCity: 'Dubai',
        destinationCode: 'TRV',
        destinationCity: 'Thiruvananthapuram',
        airline: 'Air Arabia',
        departureDate: '2026-03-12',
        arrivalDate: '2026-03-12',
        price: 950,
        totalSeats: 40,
        remainingSeats: 2,
    },
];

// ─── Flight Options per Route ──────────────────────────────────────────────
export const mockFlights: FlightOption[] = [
    {
        id: 'f1',
        routeId: 'r1',
        segments: [
            {
                flightNumber: 'OV286',
                airline: 'SalamAir',
                departureAirport: 'JED',
                departureCity: 'Jeddah',
                departureTime: '16:55',
                arrivalAirport: 'MCT',
                arrivalCity: 'Muscat',
                arrivalTime: '21:30',
                duration: '3h 35m',
            },
            {
                flightNumber: 'OV773',
                airline: 'SalamAir',
                departureAirport: 'MCT',
                departureCity: 'Muscat',
                departureTime: '22:30',
                arrivalAirport: 'CCJ',
                arrivalCity: 'Kozhikode',
                arrivalTime: '03:20',
                duration: '3h 50m',
            }
        ],
        totalDuration: '7h 55m',
        stops: 1,
        baggage: '40kg',
        price: 1300,
        totalSeats: 50,
        remainingSeats: 3,
        departureDate: '2026-03-08',
        arrivalDate: '2026-03-09',
    },
    {
        id: 'f2',
        routeId: 'r1',
        segments: [
            {
                flightNumber: 'SV741',
                airline: 'Saudia Airlines',
                departureAirport: 'JED',
                departureCity: 'Jeddah',
                departureTime: '08:20',
                arrivalAirport: 'CCJ',
                arrivalCity: 'Kozhikode',
                arrivalTime: '16:45',
                duration: '6h 25m',
            }
        ],
        totalDuration: '6h 25m',
        stops: 0,
        baggage: '30kg',
        price: 1550,
        totalSeats: 30,
        remainingSeats: 9,
        departureDate: '2026-03-08',
        arrivalDate: '2026-03-08',
    },
    {
        id: 'f3',
        routeId: 'r2',
        segments: [
            {
                flightNumber: 'SV891',
                airline: 'Saudia Airlines',
                departureAirport: 'JED',
                departureCity: 'Jeddah',
                departureTime: '11:35',
                arrivalAirport: 'COK',
                arrivalCity: 'Kochi',
                arrivalTime: '18:50',
                duration: '7h 15m',
            }
        ],
        totalDuration: '7h 15m',
        stops: 0,
        baggage: '2PC',
        price: 1450,
        totalSeats: 80,
        remainingSeats: 12,
        departureDate: '2026-03-10',
        arrivalDate: '2026-03-10',
    },
];
