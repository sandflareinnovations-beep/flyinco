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

    if (process.env.NODE_ENV === 'development') {
        console.log("[Flyinco API] Using Base URL:", finalUrl);
    }
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
        list: async (params?: { page?: number; limit?: number; search?: string; availableOnly?: boolean }): Promise<any> => {
            const query = new URLSearchParams();
            if (params?.page) query.append('page', params.page.toString());
            if (params?.limit) query.append('limit', params.limit.toString());
            if (params?.search) query.append('search', params.search);
            if (params?.availableOnly) query.append('availableOnly', 'true');
            if (!params) query.append('t', Date.now().toString());

            const data = await fetchWithCreds(`/routes?${query.toString()}`);
            
            // Handle both legacy array response and new paginated response
            const routesArray = Array.isArray(data) ? data : (data.routes || []);
            
            const mapped = routesArray.map((d: any) => ({
                id: d.id,
                originCode: d.origin,
                originCity: d.originCity || "Origin City",
                destinationCode: d.destination,
                destinationCity: d.destinationCity || "Dest City",
                price: d.price,
                totalSeats: d.totalSeats,
                remainingSeats: d.remainingSeats,
                heldSeats: d.heldSeats || 0,
                soldSeats: d.soldSeats !== undefined ? d.soldSeats : (d.totalSeats - d.remainingSeats),
                departureTime: d.departureTime || "",
                arrivalTime: d.arrivalTime || "",
                airline: d.airline || "",
                flightNumber: d.flightNumber || "",
                duration: d.duration || "",
                departureDate: d.departureDate ? d.departureDate.split('T')[0] : "",
                arrivalDate: d.arrivalDate ? d.arrivalDate.split('T')[0] : "",
                baggage: d.baggage || "2PC BAGGAGE",
                airlineLogo: d.airlineLogo || "",
                layover: d.layover || "",
                flightRules: d.flightRules || "",
                flightDetails: d.flightDetails || "",
                bookingStatus: d.bookingStatus || "OPEN",
            }));

            if (params?.page || params?.limit || params?.search || params?.availableOnly) {
                return { ...data, routes: mapped };
            }
            return mapped;
        },
        listPaginated: async (params: { page: number; limit: number; search?: string; availableOnly?: boolean }): Promise<any> => {
            const query = new URLSearchParams();
            query.append('page', params.page.toString());
            query.append('limit', params.limit.toString());
            if (params.search) query.append('search', params.search);
            if (params.availableOnly) query.append('availableOnly', 'true');

            const data = await fetchWithCreds(`/routes?${query.toString()}`);
            const routesArray = data.routes || [];
            
            const mapped = routesArray.map((d: any) => ({
                id: d.id,
                originCode: d.origin,
                originCity: d.originCity || "Origin City",
                destinationCode: d.destination,
                destinationCity: d.destinationCity || "Dest City",
                price: d.price,
                totalSeats: d.totalSeats,
                remainingSeats: d.remainingSeats,
                heldSeats: d.heldSeats || 0,
                soldSeats: d.soldSeats !== undefined ? d.soldSeats : (d.totalSeats - d.remainingSeats),
                departureTime: d.departureTime || "",
                arrivalTime: d.arrivalTime || "",
                airline: d.airline || "",
                flightNumber: d.flightNumber || "",
                duration: d.duration || "",
                departureDate: d.departureDate ? d.departureDate.split('T')[0] : "",
                arrivalDate: d.arrivalDate ? d.arrivalDate.split('T')[0] : "",
                baggage: d.baggage || "2PC BAGGAGE",
                airlineLogo: d.airlineLogo || "",
                layover: d.layover || "",
                flightRules: d.flightRules || "",
                flightDetails: d.flightDetails || "",
                bookingStatus: d.bookingStatus || "OPEN",
            }));
            return { ...data, routes: mapped };
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
                heldSeats: d.heldSeats || 0,
                soldSeats: d.soldSeats !== undefined ? d.soldSeats : (d.totalSeats - d.remainingSeats),
                departureTime: d.departureTime || "",
                arrivalTime: d.arrivalTime || "",
                airline: d.airline || "",
                flightNumber: d.flightNumber || "",
                duration: d.duration || "",
                departureDate: d.departureDate ? d.departureDate.split('T')[0] : "",
                arrivalDate: d.arrivalDate ? d.arrivalDate.split('T')[0] : "",
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
        bulkDelete: async (ids: string[]) => {
            return await fetchWithCreds('/routes/bulk', {
                method: 'DELETE',
                body: JSON.stringify({ ids }),
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
        list: async (params?: { page?: number; limit?: number; search?: string; agent?: string; phone?: string; supplier?: string }): Promise<any> => {
            const query = new URLSearchParams();
            if (params?.page) query.append('page', params.page.toString());
            if (params?.limit) query.append('limit', params.limit.toString());
            if (params?.search) query.append('search', params.search);
            if (params?.agent) query.append('agent', params.agent);
            if (params?.phone) query.append('phone', params.phone);
            if (params?.supplier) query.append('supplier', params.supplier);
            
            const data = await fetchWithCreds(`/bookings?${query.toString()}`);
            
            // Handle both legacy array response and new paginated response
            const bookingsArray = Array.isArray(data) ? data : (data.bookings || []);
            
            const mapped = bookingsArray.map((d: any) => ({
                id: d.id,
                sectorId: d.routeId,
                passengerName: d.passengerName,
                passportNumber: d.passportNumber,
                gender: d.gender,
                nationality: d.nationality || "Unknown",
                dateOfBirth: d.dateOfBirth,
                passportExpiry: d.passportExpiry,
                phone: d.phone,
                email: d.email,
                status: d.status,
                paymentStatus: d.paymentStatus || 'UNPAID',
                farePrice: d.route?.price || 0,
                purchasePrice: d.purchasePrice || 0,
                sellingPrice: d.sellingPrice || d.route?.price || 0,
                baseFare: d.baseFare || 0,
                taxes: d.taxes || 0,
                serviceFee: d.serviceFee || 0,
                profit: d.profit || 0,
                ticketNumber: d.ticketNumber || "",
                pnr: d.pnr || "",
                travelDate: d.travelDate,
                airline: d.airline || "",
                sector: d.sector || "",
                prefix: d.prefix || "",
                givenName: d.givenName || "",
                surname: d.surname || "",
                supplier: d.supplier || "",
                agencyEmail: d.agencyEmail || "",
                paymentMethod: d.paymentMethod || "",
                request: d.request || "",
                remarks: d.remarks || "",
                agentDetails: d.agentDetails || "",
                createdAt: d.createdAt,
                route: d.route,
                user: d.user || null,
            }));

            if (params?.page || params?.limit || params?.search || params?.agent || params?.phone) {
                return { ...data, bookings: mapped };
            }
            return mapped;
        },
        listPaginated: async (params: { page: number; limit: number; search?: string; agent?: string; phone?: string; supplier?: string }): Promise<any> => {
            const query = new URLSearchParams();
            query.append('page', params.page.toString());
            query.append('limit', params.limit.toString());
            if (params.search) query.append('search', params.search);
            if (params.agent) query.append('agent', params.agent);
            if (params.phone) query.append('phone', params.phone);
            if (params.supplier) query.append('supplier', params.supplier);
            
            const data = await fetchWithCreds(`/bookings?${query.toString()}`);
            const bookingsArray = data.bookings || [];
            
            const mapped = bookingsArray.map((d: any) => ({
                id: d.id,
                sectorId: d.routeId,
                passengerName: d.passengerName,
                passportNumber: d.passportNumber,
                gender: d.gender,
                nationality: d.nationality || "Unknown",
                dateOfBirth: d.dateOfBirth,
                passportExpiry: d.passportExpiry,
                phone: d.phone,
                email: d.email,
                status: d.status,
                paymentStatus: d.paymentStatus || 'UNPAID',
                farePrice: d.route?.price || 0,
                purchasePrice: d.purchasePrice || 0,
                sellingPrice: d.sellingPrice || d.route?.price || 0,
                baseFare: d.baseFare || 0,
                taxes: d.taxes || 0,
                serviceFee: d.serviceFee || 0,
                profit: d.profit || 0,
                ticketNumber: d.ticketNumber || "",
                pnr: d.pnr || "",
                travelDate: d.travelDate,
                airline: d.airline || "",
                sector: d.sector || "",
                prefix: d.prefix || "",
                givenName: d.givenName || "",
                surname: d.surname || "",
                supplier: d.supplier || "",
                agencyEmail: d.agencyEmail || "",
                paymentMethod: d.paymentMethod || "",
                request: d.request || "",
                remarks: d.remarks || "",
                agentDetails: d.agentDetails || "",
                createdAt: d.createdAt,
                route: d.route,
                user: d.user || null,
            }));
            return { ...data, bookings: mapped };
        },
        listSuppliers: async () => {
            return await fetchWithCreds('/bookings/suppliers');
        },
        getMetrics: async () => {
            return await fetchWithCreds('/bookings/metrics');
        },
        create: async (data: { sectorId: string; passengerName: string; passportNumber: string; nationality: string; phone: string; email: string }) => {
            return await fetchWithCreds('/bookings', {
                method: 'POST',
                body: JSON.stringify({
                    routeId: data.sectorId,
                    passengerName: data.passengerName,
                    passportNumber: data.passportNumber,
                    nationality: data.nationality,
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
        list: async (params?: { page?: number; limit?: number; search?: string }): Promise<any> => {
            const query = new URLSearchParams();
            if (params?.page) query.append('page', params.page.toString());
            if (params?.limit) query.append('limit', params.limit.toString());
            if (params?.search) query.append('search', params.search);

            const data = await fetchWithCreds(`/users?${query.toString()}`);
            if (params?.page || params?.limit || params?.search) {
                return data; // Returns { users, total, page, limit }
            }
            return data; // Returns just the array if no params? Wait, backend still returns array if no params.
        },
        listPaginated: async (params: { page: number; limit: number; search?: string }): Promise<any> => {
            const query = new URLSearchParams();
            query.append('page', params.page.toString());
            query.append('limit', params.limit.toString());
            if (params.search) query.append('search', params.search);
            return await fetchWithCreds(`/users?${query.toString()}`);
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
        update: async (id: string, data: any) => {
            return await fetchWithCreds(`/users/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },
        delete: async (id: string) => {
            return await fetchWithCreds(`/users/${id}`, {
                method: 'DELETE',
            });
        }
    },
    auth: {
        me: async () => {
            return await fetchWithCreds('/auth/me');
        }
    },
    announcements: {
        list: async () => {
            return await fetchWithCreds('/announcements');
        },
        create: async (data: any) => {
            return await fetchWithCreds('/announcements', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        delete: async (id: string) => {
            return await fetchWithCreds(`/announcements/${id}`, { method: 'DELETE' });
        }
    },
    payments: {
        list: async () => {
            return await fetchWithCreds('/payments');
        },
        create: async (data: any) => {
            return await fetchWithCreds('/payments', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        delete: async (id: string) => {
            return await fetchWithCreds(`/payments/${id}`, { method: 'DELETE' });
        },
        byAgent: async (agentId: string) => {
            return await fetchWithCreds(`/payments/agent/${agentId}`);
        },
        createSupplier: async (data: any) => {
            return await fetchWithCreds('/payments/supplier', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        bySupplier: async (name: string) => {
            return await fetchWithCreds(`/payments/supplier/${name}`);
        },
        deleteSupplier: async (id: string) => {
            return await fetchWithCreds(`/payments/supplier/${id}`, { method: 'DELETE' });
        }
    }
};
