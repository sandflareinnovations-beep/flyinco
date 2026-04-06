"use client";
import { PiAirplaneTilt, PiArrowRight, PiCalendarBlank, PiMapPin, PiWarningCircle } from "react-icons/pi";
import { useEffect, useState } from "react";
import { flyApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function StaffBookPage() {
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        flyApi.sectors.list({ availableOnly: true })
            .then((data: any) => {
                const list = Array.isArray(data) ? data : (data.routes || []);
                setRoutes(list);
            })
            .catch(() => setRoutes([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Book a Ticket</h1>
                <p className="text-gray-400 text-sm mt-0.5">
                    Browse available flights and create a new booking for a passenger.
                </p>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-[200px] w-full rounded-2xl" />
                    ))}
                </div>
            ) : routes.length === 0 ? (
                <div className="text-center py-16">
                    <div
                        className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                        style={{ background: "linear-gradient(135deg, #2E0A57, #6C2BD9)" }}
                    >
                        <PiAirplaneTilt className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">No Available Flights</h2>
                    <p className="text-gray-400 text-sm mt-1">There are no open routes at the moment. Check back later.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {routes.map((route) => {
                        const isLowSeats = route.remainingSeats <= 3;
                        return (
                            <div
                                key={route.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #2E0A57, #6C2BD9)" }} />
                                <div className="p-5">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(108,43,217,0.1)" }}>
                                                {route.airlineLogo ? (
                                                    <img src={route.airlineLogo} alt={route.airline} className="h-5 w-auto object-contain" />
                                                ) : (
                                                    <PiAirplaneTilt className="h-4 w-4 text-violet-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900">{route.airline}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">{route.flightNumber}</p>
                                            </div>
                                        </div>
                                        {isLowSeats ? (
                                            <Badge variant="destructive" className="gap-1 text-[10px] font-semibold animate-pulse">
                                                <PiWarningCircle className="h-3 w-3" />
                                                Only {route.remainingSeats} left!
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border-emerald-200">
                                                {route.remainingSeats} seats
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Route */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-gray-900">{route.originCode}</p>
                                            <p className="text-xs text-gray-400">{route.originCity}</p>
                                        </div>
                                        <div className="flex-1 mx-4 flex items-center gap-2">
                                            <div className="flex-1 h-px bg-gray-200" />
                                            <PiArrowRight className="h-4 w-4 text-violet-500 flex-shrink-0" />
                                            <div className="flex-1 h-px bg-gray-200" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-gray-900">{route.destinationCode}</p>
                                            <p className="text-xs text-gray-400">{route.destinationCity}</p>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                                        <span className="flex items-center gap-1">
                                            <PiCalendarBlank className="h-3.5 w-3.5" />
                                            {route.departureDate ? new Date(route.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                                        </span>
                                        {route.departureTime && (
                                            <span className="font-medium text-violet-600">{route.departureTime}</span>
                                        )}
                                        {route.duration && <span>{route.duration}</span>}
                                    </div>

                                    {/* Price + CTA */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">From</p>
                                            <p className="text-xl font-black text-violet-600">
                                                SAR {route.price?.toLocaleString()}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="text-white font-bold rounded-xl px-5 shadow-md"
                                            style={{ background: "linear-gradient(135deg, #2E0A57, #6C2BD9)" }}
                                            onClick={() => router.push(`/routes/${route.id}/flights`)}
                                        >
                                            Book Now
                                            <PiArrowRight className="h-3.5 w-3.5 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
