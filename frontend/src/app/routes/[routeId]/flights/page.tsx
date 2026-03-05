"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FlightCard } from "@/components/flights/flight-card";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE } from "@/lib/api";

const BRAND = "#2E0A57";

// The one supported route — always RUH → COK
const ROUTE_INFO = {
    id: "ruh-cok",
    originCode: "RUH",
    originCity: "Riyadh",
    destinationCode: "COK",
    destinationCity: "Kochi",
    departureDate: "2026-03-09",
    airline: "Saudia Airlines",
};

// Exact matching flight to remove mock data clutter and SalamAir
const SAUDIA_FLIGHT = {
    id: "ruh-cok-sv890",
    routeId: "ruh-cok",
    segments: [
        {
            flightNumber: 'SV 890',
            airline: 'Saudia Airlines',
            departureAirport: 'RUH',
            departureCity: 'Riyadh',
            departureTime: '11:00 AM',
            arrivalAirport: 'COK',
            arrivalCity: 'Cochin',
            arrivalTime: '06:15 PM',
            duration: '7h 15m',
        }
    ],
    totalDuration: '7h 15m',
    stops: 0,
    baggage: '2 PC / 30kg',
    price: 1300,
    totalSeats: 150,
    remainingSeats: 24, // shows availability but not critical
    departureDate: '2026-03-09',
    arrivalDate: '2026-03-09',
};

export default function FlightsPage() {
    const { routeId } = useParams<{ routeId: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [bookingStatus, setBookingStatus] = useState<"OPEN" | "CLOSED">("OPEN");

    useEffect(() => {
        // Check booking status from backend (RUH→COK route in DB)
        const checkStatus = async () => {
            try {
                const res = await fetch(`${API_BASE}/routes`, { credentials: "include" });
                if (res.ok) {
                    const routes = await res.json();
                    const ruhCok = routes.find((r: any) => r.origin === "RUH" && r.destination === "COK");
                    if (ruhCok) {
                        setBookingStatus(ruhCok.bookingStatus || "OPEN");
                        // Sync price and seats dynamically if DB has it
                        SAUDIA_FLIGHT.price = ruhCok.price;
                        SAUDIA_FLIGHT.remainingSeats = ruhCok.remainingSeats;
                    }
                }
            } catch {
                // Backend down — keep OPEN from mock
            } finally {
                setLoading(false);
            }
        };
        checkStatus();
    }, []);

    const availableFlights = [SAUDIA_FLIGHT];

    return (
        <div className="min-h-screen bg-[#F7F7FB]">
            {/* Header */}
            <div className="bg-white sticky top-0 md:top-[64px] z-40" style={{ borderBottom: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div className="container mx-auto px-4 md:px-8 max-w-5xl py-4 flex items-center gap-4 flex-wrap">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/")} style={{ color: "#6B7280" }} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Home
                    </Button>
                    <div className="h-5 w-px bg-gray-200 hidden md:block" />
                    <div className="flex items-center gap-3">
                        <span className="font-black text-xl" style={{ color: BRAND }}>{ROUTE_INFO.originCode}</span>
                        <span style={{ color: "#9CA3AF" }}>→</span>
                        <span className="font-black text-xl" style={{ color: BRAND }}>{ROUTE_INFO.destinationCode}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#2E0A57" }}>
                        <Calendar className="h-4 w-4" style={{ color: "#6C2BD9" }} />
                        <span>09 March 2026</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 max-w-5xl py-10">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(1)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
                    </div>
                ) : bookingStatus === "CLOSED" ? (
                    /* Booking Closed Card */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center min-h-[400px]"
                    >
                        <div className="max-w-md w-full bg-white rounded-3xl shadow-md border border-gray-100 p-10 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                                <Lock className="h-8 w-8 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Booking Closed</h2>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                This special fare booking is currently closed.
                                <br />We will reopen soon.
                            </p>
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm text-orange-700 font-medium mb-6">
                                🔔 Route: <strong>RUH → COK</strong> · 09 March 2026
                            </div>
                            <Button
                                variant="outline"
                                className="rounded-xl w-full hover:bg-gray-50 text-gray-900"
                                onClick={() => router.push("/")}
                            >
                                Back to Home
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    /* Flights List */
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ letterSpacing: "-0.03em" }}>
                                {ROUTE_INFO.originCity} → {ROUTE_INFO.destinationCity}
                            </h1>
                            <p className="text-gray-500 text-sm font-medium">1 special fare direct flight available</p>
                        </motion.div>

                        <div className="space-y-4">
                            {availableFlights.map((flight, i) => (
                                <FlightCard key={flight.id} flight={flight} routeId={routeId} index={i} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
