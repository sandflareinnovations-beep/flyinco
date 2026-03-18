"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FlightCard } from "@/components/flights/flight-card";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { flyApi } from "@/lib/api";
import { FareSector } from "@/lib/types";

const BRAND = "#2E0A57";

export default function FlightsPage() {
    const { routeId } = useParams<{ routeId: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookingStatus, setBookingStatus] = useState<string>("OPEN");
    const [activeSector, setActiveSector] = useState<FareSector | null>(null);

    useEffect(() => {
        const loadRoute = async () => {
            try {
                setLoading(true);
                const routes = await flyApi.sectors.list();
                let foundSector: FareSector | undefined;

                if (routeId === "ruh-cok") {
                    // Legacy slug support
                    foundSector = routes.find(r =>
                        (r.originCode === "RUH" && r.destinationCode === "COK") ||
                        (r.originCode === "RUH" && r.destinationCode === "BOM") ||
                        r.id === routeId
                    );
                } else {
                    // Try exact ID match first
                    foundSector = routes.find(r => r.id === routeId);
                }

                if (foundSector) {
                    setActiveSector(foundSector);
                    setBookingStatus(foundSector.bookingStatus || "OPEN");
                } else {
                    setError("Flight route not found or currently unavailable.");
                }
            } catch (err) {
                console.error("Failed to load route:", err);
                setError("Could not connect to the booking server. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        loadRoute();
    }, [routeId]);

    // Format flight object for FlightCard (adapting DB model to UI model)
    const availableFlights = activeSector ? [{
        id: activeSector.id,
        routeId: activeSector.id,
        segments: [
            {
                flightNumber: activeSector.flightNumber,
                airline: activeSector.airline,
                departureAirport: activeSector.originCode,
                departureCity: activeSector.originCity,
                departureTime: activeSector.departureTime,
                arrivalAirport: activeSector.destinationCode,
                arrivalCity: activeSector.destinationCity,
                arrivalTime: activeSector.arrivalTime,
                duration: activeSector.duration,
            }
        ],
        totalDuration: activeSector.duration,
        stops: activeSector.layover ? 1 : 0,
        baggage: activeSector.baggage,
        price: activeSector.price,
        totalSeats: activeSector.totalSeats,
        remainingSeats: activeSector.remainingSeats,
        departureDate: activeSector.departureDate,
        arrivalDate: activeSector.departureDate,
        airlineLogo: activeSector.airlineLogo,
        flightRules: activeSector.flightRules,
        flightDetails: activeSector.flightDetails,
        layover: activeSector.layover
    }] : [];

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

                    {activeSector ? (
                        <div className="flex items-center gap-3">
                            <span className="font-black text-xl" style={{ color: BRAND }}>{activeSector.originCode}</span>
                            <span style={{ color: "#9CA3AF" }}>→</span>
                            <span className="font-black text-xl" style={{ color: BRAND }}>{activeSector.destinationCode}</span>
                        </div>
                    ) : (
                        <Skeleton className="h-8 w-32 rounded-lg" />
                    )}

                    <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#2E0A57" }}>
                        <Calendar className="h-4 w-4" style={{ color: "#6C2BD9" }} />
                        <span>
                            {activeSector?.departureDate
                                ? new Date(activeSector.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : "Loading date..."}
                        </span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 max-w-5xl py-10">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(1)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
                    </div>
                ) : error ? (
                    <div className="max-w-md w-full bg-white rounded-3xl shadow-md border border-gray-100 p-10 text-center mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle className="h-8 w-8 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Notice</h2>
                        <p className="text-gray-500 mb-6 leading-relaxed">{error}</p>
                        <Button
                            variant="outline"
                            className="rounded-xl w-full hover:bg-gray-50 text-gray-900"
                            onClick={() => router.push("/")}
                        >
                            Back to Home
                        </Button>
                    </div>
                ) : (bookingStatus === "CLOSED" || bookingStatus === "SOLD" || (activeSector?.remainingSeats || 0) <= 0) ? (
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
                            <h2 className="text-2xl font-black text-gray-900 mb-2">
                                {bookingStatus === "SOLD" || (activeSector?.remainingSeats || 0) <= 0 ? "Sold Out" : "Booking Closed"}
                            </h2>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                {bookingStatus === "SOLD" || (activeSector?.remainingSeats || 0) <= 0 
                                    ? "All seats for this special fare have been sold." 
                                    : "This special fare booking is currently closed."}
                                <br />Please check other dates or routes.
                            </p>
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm text-orange-700 font-medium mb-6">
                                🔔 Route: <strong>{activeSector?.originCode} → {activeSector?.destinationCode}</strong> · {activeSector?.departureDate}
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
                                {activeSector?.originCity} → {activeSector?.destinationCity}
                            </h1>
                            <p className="text-gray-500 text-sm font-medium">
                                {availableFlights.length} special fare {availableFlights.some(f => f.layover) ? "flight" : "direct flight"}{availableFlights.length !== 1 ? "s" : ""} available
                            </p>
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

