"use client";

import { FlightSegment } from "@/lib/types";
import { Plane } from "lucide-react";
import { motion } from "framer-motion";

interface TimelineFlightProps {
    segments: FlightSegment[];
}

export function TimelineFlight({ segments }: TimelineFlightProps) {
    return (
        <div className="relative">
            {segments.map((seg, i) => (
                <div key={i}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="flex items-start gap-4"
                    >
                        {/* Timeline Track */}
                        <div className="flex flex-col items-center flex-shrink-0 pt-1">
                            <div className="w-4 h-4 rounded-full border-2 border-blue-600 bg-white dark:bg-zinc-900 z-10" />
                            {i < segments.length - 1 && (
                                <div className="w-px flex-1 bg-blue-200 dark:bg-blue-900 mt-1" style={{ minHeight: '80px' }} />
                            )}
                        </div>

                        {/* Segment Info */}
                        <div className="flex-1 pb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Plane className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400">{seg.airline} · {seg.flightNumber}</span>
                            </div>

                            <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-black text-gray-900 dark:text-white">{seg.departureTime}</p>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-0.5">{seg.departureAirport}</p>
                                        <p className="text-xs text-gray-400">{seg.departureCity}</p>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <span className="text-xs text-gray-400 mb-1">{seg.duration}</span>
                                        <div className="flex items-center gap-1">
                                            <div className="w-16 h-px bg-gray-300 dark:bg-zinc-600" />
                                            <Plane className="h-4 w-4 text-blue-500 rotate-90" />
                                            <div className="w-16 h-px bg-gray-300 dark:bg-zinc-600" />
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-3xl font-black text-gray-900 dark:text-white">{seg.arrivalTime}</p>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-0.5">{seg.arrivalAirport}</p>
                                        <p className="text-xs text-gray-400">{seg.arrivalCity}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Layover pill between segments */}
                    {i < segments.length - 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.15 + 0.1 }}
                            className="ml-9 mb-2"
                        >
                            <div className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 rounded-full px-3 py-1 text-xs font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                Layover at {seg.arrivalAirport}
                            </div>
                        </motion.div>
                    )}
                </div>
            ))}

            {/* Destination endpoint */}
            <div className="flex items-start gap-4">
                <div className="flex flex-col items-center flex-shrink-0 pt-1">
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500 z-10" />
                </div>
                <div className="pb-2">
                    <p className="text-sm font-bold text-emerald-600">{segments[segments.length - 1].arrivalCity}</p>
                    <p className="text-xs text-gray-400">{segments[segments.length - 1].arrivalAirport} — Arrival</p>
                </div>
            </div>
        </div>
    );
}
