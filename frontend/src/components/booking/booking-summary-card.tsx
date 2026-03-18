"use client";

import { FlightOption, PassengerCounts } from "@/lib/types";
import { Plane, Calendar, Luggage, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface BookingSummaryCardProps {
    flight: FlightOption;
    passengerCounts: PassengerCounts;
    adultPrice?: number;
    childPrice?: number;
    infantPrice?: number;
}

export function BookingSummaryCard({
    flight,
    passengerCounts,
    adultPrice,
    childPrice = 0,
    infantPrice = 0,
}: BookingSummaryCardProps) {
    const baseAdultPrice = adultPrice ?? flight.price;
    const firstSeg = flight.segments[0];
    const lastSeg = flight.segments[flight.segments.length - 1];

    const adultTotal = passengerCounts.adults * baseAdultPrice;
    const childTotal = passengerCounts.children * childPrice;
    const infantTotal = passengerCounts.infants * infantPrice;
    const grandTotal = adultTotal + childTotal + infantTotal;

    return (
        <Card className="shadow-sm border-gray-100 dark:border-zinc-800 sticky top-24">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Plane className="h-4 w-4" style={{ color: '#2E0A57' }} />
                    Booking Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Route */}
                <div className="rounded-xl p-3 bg-[#F5F3FF] dark:bg-purple-900/20">
                    <div className="flex items-center justify-between">
                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{firstSeg.departureAirport}</p>
                            <p className="text-xs text-gray-500">{firstSeg.departureCity}</p>
                        </div>
                        <div className="flex-1 mx-3 flex flex-col items-center">
                            <div className="w-full h-px bg-purple-200 dark:bg-purple-800 relative">
                                <Plane className="h-3 w-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: '#6C2BD9' }} />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{lastSeg.arrivalAirport}</p>
                            <p className="text-xs text-gray-500">{lastSeg.arrivalCity}</p>
                        </div>
                    </div>
                </div>

                {/* Flight Info */}
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: '#6C2BD9' }} />
                        <span>{new Date(flight.departureDate).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Luggage className="h-4 w-4 flex-shrink-0" style={{ color: '#6C2BD9' }} />
                        <span>Baggage: {flight.baggage}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4 flex-shrink-0" style={{ color: '#6C2BD9' }} />
                        <span>
                            {passengerCounts.adults > 0 && `${passengerCounts.adults} Adult${passengerCounts.adults > 1 ? 's' : ''}`}
                            {passengerCounts.children > 0 && `, ${passengerCounts.children} Child`}
                            {passengerCounts.infants > 0 && `, ${passengerCounts.infants} Infant`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Plane className="h-4 w-4 flex-shrink-0" style={{ color: '#6C2BD9' }} />
                        <span className="font-mono text-xs">{flight.segments.map(s => s.flightNumber).join(' + ')}</span>
                    </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                    {passengerCounts.adults > 0 && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Adult × {passengerCounts.adults}</span>
                            <span className="font-semibold">SAR {adultTotal.toLocaleString()}</span>
                        </div>
                    )}
                    {passengerCounts.children > 0 && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Child × {passengerCounts.children}</span>
                            <span className="font-semibold">SAR {childTotal.toLocaleString()}</span>
                        </div>
                    )}
                    {passengerCounts.infants > 0 && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Infant × {passengerCounts.infants}</span>
                            <span className="font-semibold">SAR {infantTotal.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-black" style={{ color: '#2E0A57' }}>SAR {grandTotal.toLocaleString()}</span>
                </div>
            </CardContent>
        </Card>
    );
}
