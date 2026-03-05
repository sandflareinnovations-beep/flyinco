// ─── Existing Types ────────────────────────────────────────────────────────

export type FareSector = {
    id: string;
    originCode: string;
    originCity: string;
    destinationCode: string;
    destinationCity: string;
    price: number;
    totalSeats: number;
    remainingSeats: number;
    heldSeats: number;
    soldSeats: number;
    departureTime: string;
    arrivalTime: string;
    airline: string;
    flightNumber: string;
    duration: string;
    departureDate?: string;
    baggage?: string;
    airlineLogo?: string;
    layover?: string;
    flightRules?: string;
    flightDetails?: string;
    bookingStatus?: string;
};

export type Booking = {
    id: string;
    sectorId: string;
    passengerName: string;
    passportNumber: string;
    nationality: string;
    phone: string;
    email: string;
    status: 'HELD' | 'CONFIRMED' | 'CANCELLED';
    farePrice: number;
    createdAt: string;
    route: string;
};

// ─── New Flight Booking Types ───────────────────────────────────────────────

export type RouteOption = {
    id: string;
    originCode: string;
    originCity: string;
    destinationCode: string;
    destinationCity: string;
    airline: string;
    airlineLogo?: string;
    departureDate: string;
    arrivalDate: string;
    price: number;          // price per adult in SAR
    totalSeats: number;
    remainingSeats: number;
};

export type FlightSegment = {
    flightNumber: string;
    airline: string;
    airlineLogo?: string;
    departureAirport: string;
    departureCity: string;
    departureTime: string;
    arrivalAirport: string;
    arrivalCity: string;
    arrivalTime: string;
    duration: string;
};

export type FlightOption = {
    id: string;
    routeId: string;
    segments: FlightSegment[];
    totalDuration: string;
    stops: number;
    baggage: string;
    price: number;
    totalSeats: number;
    remainingSeats: number;
    departureDate: string;
    arrivalDate: string;
};

export type PassengerCounts = {
    adults: number;
    children: number;
    infants: number;
};

export type PassengerDetail = {
    title: string;
    firstName: string;
    lastName: string;
    passportNumber: string;
    nationality: string;
    dateOfBirth: string;
    passportExpiry: string;
    countryOfIssue: string;
    type: 'ADULT' | 'CHILD' | 'INFANT';
};

export type BookingFormData = {
    phone: string;
    alternatePhone: string;
    email: string;
    passengers: PassengerDetail[];
    flightId: string;
    passengeCounts: PassengerCounts;
    totalPrice: number;
};

export type BookingConfirmation = {
    bookingId: string;
    bookingRef: string;
    status: 'HELD' | 'CONFIRMED' | 'CANCELLED';
    route: string;
    flightNumbers: string;
    departureDate: string;
    totalPrice: number;
    email: string;
};
