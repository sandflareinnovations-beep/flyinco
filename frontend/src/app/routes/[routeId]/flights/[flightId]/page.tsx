"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { mockFlights } from "@/lib/mock";
import { TimelineFlight } from "@/components/flights/timeline-flight";
import { BookingSummaryCard } from "@/components/booking/booking-summary-card";
import { PassengerCounts } from "@/lib/types";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, Luggage, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function FlightDetailsPage() {
    const { routeId, flightId } = useParams<{ routeId: string; flightId: string }>();
    const router = useRouter();

    const flight = mockFlights.find(f => f.id === flightId);

    const [passengerCounts, setPassengerCounts] = useState<PassengerCounts>({
        adults: 1,
        children: 0,
        infants: 0,
    });

    if (!flight) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl font-bold mb-2">Flight not found</p>
                    <Button onClick={() => router.back()} variant="outline">Go Back</Button>
                </div>
            </div>
        );
    }

    const totalPassengers = passengerCounts.adults + passengerCounts.children + passengerCounts.infants;
    const totalPrice = passengerCounts.adults * flight.price;
    const firstSeg = flight.segments[0];
    const lastSeg = flight.segments[flight.segments.length - 1];

    const adjust = (type: keyof PassengerCounts, delta: number) => {
        setPassengerCounts(prev => {
            const next = { ...prev, [type]: Math.max(0, prev[type] + delta) };
            if (next.adults < 1) next.adults = 1; // minimum 1 adult
            return next;
        });
    };

    const handleBookNow = () => {
        // Store selection in sessionStorage for passenger form
        sessionStorage.setItem('selectedFlight', JSON.stringify(flight));
        sessionStorage.setItem('passengerCounts', JSON.stringify(passengerCounts));
        router.push(`/booking/passengers?routeId=${routeId}&flightId=${flightId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
            {/* Top bar */}
            <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 sticky top-16 z-40 shadow-sm">
                <div className="container mx-auto px-4 md:px-8 max-w-6xl py-4 flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 text-gray-500">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Flights
                    </Button>
                    <Separator orientation="vertical" className="h-5 hidden md:block" />
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                        <span>{firstSeg.departureAirport}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{lastSeg.arrivalAirport}</span>
                    </div>
                    <Badge variant="secondary" className="ml-auto hidden md:flex">
                        {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop`}
                    </Badge>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 max-w-6xl py-10">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* Left: Flight Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Flight Details</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    <span>Total: {flight.totalDuration}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Luggage className="h-4 w-4" />
                                    <span>Baggage: {flight.baggage}</span>
                                </div>
                            </div>
                        </div>

                        <Card className="shadow-sm border-gray-100 dark:border-zinc-800">
                            <CardContent className="p-6">
                                <TimelineFlight segments={flight.segments} />
                            </CardContent>
                        </Card>

                        {/* Passengers selector */}
                        <Card className="shadow-sm border-gray-100 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-base font-bold">Select Passengers</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {([
                                    { label: 'Adult', subtitle: '12+ years', key: 'adults' as const },
                                    { label: 'Child', subtitle: '2–11 years', key: 'children' as const },
                                    { label: 'Infant', subtitle: 'Under 2 years', key: 'infants' as const },
                                ]).map(({ label, subtitle, key }) => (
                                    <div key={key} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                                            <p className="text-xs text-gray-400">{subtitle}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 rounded-xl"
                                                onClick={() => adjust(key, -1)}
                                                disabled={key === 'adults' && passengerCounts[key] <= 1}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="text-lg font-bold w-8 text-center">{passengerCounts[key]}</span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 rounded-xl"
                                                onClick={() => adjust(key, 1)}
                                                disabled={totalPassengers >= flight.remainingSeats}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {flight.remainingSeats <= 3 && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                                        ⚠️ Only {flight.remainingSeats} seats left! Book now.
                                    </div>
                                )}

                                <Button
                                    size="lg"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12 text-base shadow-lg shadow-blue-100 dark:shadow-none mt-2"
                                    onClick={handleBookNow}
                                >
                                    Book Now — SAR {totalPrice.toLocaleString()}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Summary */}
                    <div className="lg:col-span-1">
                        <BookingSummaryCard
                            flight={flight}
                            passengerCounts={passengerCounts}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
