import { FareSector, Booking } from "./types";
import { mockSectors, mockBookings } from "./mock";

const getApiBase = () => {
    // Priority 1: Environment variable
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    let finalUrl = rawUrl.trim();

    // Priority 2: If we are on Render, try to detect if we should be using HTTPS
    if (typeof window !== 'undefined' && window.location.host.includes('onrender.com')) {
        if (!finalUrl.startsWith('http')) {
            finalUrl = `https://${finalUrl}`;
        }
    }

    // Always remove trailing slashes to avoid double slashes in paths like //bookings
    if (finalUrl.endsWith('/')) {
        finalUrl = finalUrl.slice(0, -1);
    }

    console.log("[Flyinco API] Using Base URL:", finalUrl);
    return finalUrl;
};

export const API_BASE = getApiBase();

export const fetchWithCreds = async (url: string, options: RequestInit = {}) => {
    // Try to get token from localStorage or cookie
    let token = '';
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('token') || '';
        if (!token) {
            const match = document.cookie.match(/(^| )token=([^;]+)/);
            if (match) token = match[2];
        }
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as any),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
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
        let token = '';
        if (typeof window !== 'undefined') {
            token = localStorage.getItem('token') || '';
            if (!token) {
                const match = document.cookie.match(/(^| )token=([^;]+)/);
                if (match) token = match[2];
            }
        }

        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/routes`, {
            headers,
            credentials: "include",
            signal: AbortSignal.timeout(60000), // 60 second timeout for Render cold start
        });
        return res.ok || res.status === 401;
    } catch {
        return false;
    }
};

export const flyApi = {
    sectors: {
        list: async (): Promise<FareSector[]> => {
            const data = await fetchWithCreds(`/routes?t=${Date.now()}`);
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
                departureTime: d.departureTime || "",
                arrivalTime: d.arrivalTime || "",
                airline: d.airline || "",
                flightNumber: d.flightNumber || "",
                duration: d.duration || "",
                departureDate: d.departureDate ? d.departureDate.split('T')[0] : "",
                baggage: d.baggage || "2PC BAGGAGE",
                airlineLogo: d.airlineLogo || "",
                layover: d.layover || "",
                flightRules: d.flightRules || "",
                flightDetails: d.flightDetails || "",
                bookingStatus: d.bookingStatus || "OPEN",
            }));
        },
        get: async (id: string): Promise<FareSector | undefined> => {
            const d = await fetchWithCreds(`/routes/${id}?t=${Date.now()}`);
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
                departureTime: d.departureTime || "",
                arrivalTime: d.arrivalTime || "",
                airline: d.airline || "",
                flightNumber: d.flightNumber || "",
                duration: d.duration || "",
                departureDate: d.departureDate ? d.departureDate.split('T')[0] : "",
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
        },
        updateBookingStatus: async (id: string, bookingStatus: string) => {
            return await fetchWithCreds(`/routes/${id}/booking-status`, {
                method: 'PATCH',
                body: JSON.stringify({ bookingStatus }),
            });
        }
    },
    bookings: {
        list: async (): Promise<Booking[]> => {
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
                purchasePrice: d.purchasePrice || 0,
                sellingPrice: d.sellingPrice || d.route?.price || 0,
                profit: d.profit || 0,
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
        },
        delete: async (id: string) => {
            return await fetchWithCreds(`/bookings/${id}`, {
                method: 'DELETE',
            });
        }
    },
    users: {
        list: async () => {
            return await fetchWithCreds('/users');
        },
        create: async (data: any) => {
            return await fetchWithCreds('/users', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        changePassword: async (userId: string, newPassword: string) => {
            return await fetchWithCreds('/users/change-password', {
                method: 'PATCH',
                body: JSON.stringify({ userId, newPassword }),
            });
        },
        delete: async (id: string) => {
            return await fetchWithCreds(`/users/${id}`, {
                method: 'DELETE',
            });
        }
    }
};
