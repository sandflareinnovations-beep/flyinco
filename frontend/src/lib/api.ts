import { FareSector, Booking } from "./types";
import { mockSectors, mockBookings } from "./mock";

const getApiBase = () => {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    // If it's a hostname from Render (no http/https), add https://
    if (rawUrl && !rawUrl.startsWith('http')) {
        return `https://${rawUrl}`;
    }
    return rawUrl;
};

export const API_BASE = getApiBase();

const fetchWithCreds = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        credentials: "include",
    });

    let data;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok) {
        throw new Error(data?.message || "An API error occurred");
    }

    return data;
};

// Helper to check if backend is reachable
const isBackendUp = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${API_BASE}/routes`, {
            credentials: "include",
            signal: AbortSignal.timeout(2000), // 2 second timeout
        });
        return res.ok || res.status === 401;
    } catch {
        return false;
    }
};

export const flyApi = {
    sectors: {
        list: async (): Promise<FareSector[]> => {
            const backendUp = await isBackendUp();
            if (!backendUp) {
                // Fallback to mock while backend/DB isn't running
                return [...mockSectors];
            }
            const data = await fetchWithCreds('/routes');
            return data.map((d: any) => ({
                id: d.id,
                originCode: d.origin,
                originCity: d.originCity || "Origin City",
                destinationCode: d.destination,
                destinationCity: d.destinationCity || "Dest City",
                price: d.price,
                totalSeats: d.totalSeats,
                remainingSeats: d.remainingSeats,
                heldSeats: 0,
                soldSeats: d.totalSeats - d.remainingSeats,
                departureTime: d.departureTime || "11:35 AM",
                arrivalTime: d.arrivalTime || "18:50 PM",
                airline: d.airline || "Saudia Airlines",
                flightNumber: d.flightNumber || "SV 890",
                duration: d.duration || "7h 15m",
                departureDate: d.departureDate ? new Date(d.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "09 MARCH",
                baggage: d.baggage || "2PC BAGGAGE",
                airlineLogo: d.airlineLogo || "",
                layover: d.layover || "",
                flightRules: d.flightRules || "",
                flightDetails: d.flightDetails || "",
                bookingStatus: d.bookingStatus || "OPEN",
            }));
        },
        get: async (id: string): Promise<FareSector | undefined> => {
            const backendUp = await isBackendUp();
            if (!backendUp) {
                return mockSectors.find(s => s.id === id);
            }
            const d = await fetchWithCreds(`/routes/${id}`);
            return {
                id: d.id,
                originCode: d.origin,
                originCity: d.originCity || "Origin City",
                destinationCode: d.destination,
                destinationCity: d.destinationCity || "Dest City",
                price: d.price,
                totalSeats: d.totalSeats,
                remainingSeats: d.remainingSeats,
                heldSeats: 0,
                soldSeats: d.totalSeats - d.remainingSeats,
                departureTime: d.departureTime || "11:35 AM",
                arrivalTime: d.arrivalTime || "18:50 PM",
                airline: d.airline || "Saudia Airlines",
                flightNumber: d.flightNumber || "SV 890",
                duration: d.duration || "7h 15m",
                departureDate: d.departureDate ? new Date(d.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "09 MARCH",
                baggage: d.baggage || "2PC BAGGAGE",
                airlineLogo: d.airlineLogo || "",
                layover: d.layover || "",
                flightRules: d.flightRules || "",
                flightDetails: d.flightDetails || "",
                bookingStatus: d.bookingStatus || "OPEN",
            };
        },
        create: async (data: any) => {
            return await fetchWithCreds('/routes', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        update: async (id: string, data: any) => {
            return await fetchWithCreds(`/routes/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },
        delete: async (id: string) => {
            return await fetchWithCreds(`/routes/${id}`, {
                method: 'DELETE',
            });
        }
    },
    bookings: {
        list: async (): Promise<Booking[]> => {
            const backendUp = await isBackendUp();
            if (!backendUp) {
                return [...mockBookings];
            }
            const data = await fetchWithCreds('/bookings');
            return data.map((d: any) => ({
                id: d.id,
                sectorId: d.routeId,
                passengerName: d.passengerName,
                passportNumber: d.passportNumber,
                nationality: "Unknown",
                phone: d.phone,
                email: d.email,
                status: d.status,
                farePrice: d.route?.price || 0,
                createdAt: d.createdAt,
                route: d.route ? `${d.route.origin} - ${d.route.destination}` : 'Unknown Route',
            }));
        },
        create: async (data: { sectorId: string; passengerName: string; passportNumber: string; nationality: string; phone: string; email: string }) => {
            return await fetchWithCreds('/bookings', {
                method: 'POST',
                body: JSON.stringify({
                    routeId: data.sectorId,
                    passengerName: data.passengerName,
                    passportNumber: data.passportNumber,
                    phone: data.phone,
                    email: data.email,
                }),
            });
        }
    },
    users: {
        list: async () => {
            return await fetchWithCreds('/users');
        }
    }
};
