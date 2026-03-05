"use client";

import { motion } from "framer-motion";
import { mockRoutes } from "@/lib/mock";
import { RouteCard } from "@/components/routes/route-card";
import { Plane, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function RoutesPage() {
    const [loading] = useState(false);
    const routes = mockRoutes;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
            {/* Hero banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-4 py-16 md:py-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-3xl mx-auto"
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-yellow-300" />
                        <span className="text-yellow-300 text-sm font-semibold uppercase tracking-widest">Exclusive Fares</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                        Special Fare Routes
                    </h1>
                    <p className="text-blue-100 text-lg max-w-xl mx-auto">
                        Pre-purchased inventory at unbeatable prices. Seats are limited — book before they're gone.
                    </p>
                </motion.div>
            </div>

            <div className="container mx-auto px-4 md:px-8 max-w-6xl py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Available Routes</h2>
                        <p className="text-gray-500 mt-1">{routes.length} special fares available</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Plane className="h-4 w-4" />
                        <span>Prices in SAR</span>
                    </div>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-[300px] w-full rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {routes.map((route, i) => (
                            <motion.div
                                key={route.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <RouteCard route={route} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
