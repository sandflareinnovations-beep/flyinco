"use client";
import { PiMapPinLight, PiCalendarBlankLight, PiAirplaneTiltLight, PiWarningCircleLight, PiArrowRightLight } from "react-icons/pi";
import { motion } from "framer-motion";
import { RouteOption } from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RouteCardProps {
    route: RouteOption;
}

export function RouteCard({ route }: RouteCardProps) {
    const router = useRouter();
    const isLowSeats = route.remainingSeats <= 3;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.1)" }}
            transition={{ duration: 0.25 }}
            className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden cursor-pointer group"
        >
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-500" />

            <div className="p-6">
                {/* Header row */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                            <PiAirplaneTiltLight className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white">{route.airline}</p>
                            <p className="text-xs text-gray-400">Special Fare</p>
                        </div>
                    </div>
                    {isLowSeats ? (
                        <Badge variant="destructive" className="gap-1 text-xs font-semibold animate-pulse">
                            <PiWarningCircleLight className="h-3 w-3" />
                            Only {route.remainingSeats} left!
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200">
                            {route.remainingSeats} seats available
                        </Badge>
                    )}
                </div>

                {/* Route display */}
                <div className="flex items-center justify-between mb-6">
                    <div className="text-center">
                        <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{route.originCode}</p>
                        <p className="text-sm text-gray-500 mt-1 font-medium">{route.originCity}</p>
                    </div>

                    <div className="flex-1 mx-6 flex flex-col items-center gap-1">
                        <div className="flex items-center w-full gap-2">
                            <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
                            <PiArrowRightLight className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
                        </div>
                        <span className="text-xs text-gray-400">Direct / 1 Stop</span>
                    </div>

                    <div className="text-center">
                        <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{route.destinationCode}</p>
                        <p className="text-sm text-gray-500 mt-1 font-medium">{route.destinationCity}</p>
                    </div>
                </div>

                {/* Info row */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-5">
                    <div className="flex items-center gap-1.5">
                        <PiCalendarBlankLight className="h-4 w-4" />
                        <span>{new Date(route.departureDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <PiMapPinLight className="h-4 w-4" />
                        <span>{route.originCity}</span>
                    </div>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">From</p>
                        <p className="text-3xl font-black text-blue-600">
                            SAR {route.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">per person</p>
                    </div>
                    <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-blue-200 dark:shadow-none transition-all"
                        onClick={() => router.push(`/routes/${route.id}/flights`)}
                    >
                        Select Flight
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
