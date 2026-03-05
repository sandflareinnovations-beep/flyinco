"use client";

import { FareSector } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plane, Calendar, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

interface SectorCardProps {
    sector: FareSector;
    onBook: (sector: FareSector) => void;
}

export function SectorCard({ sector, onBook }: SectorCardProps) {
    const isSoldOut = sector.remainingSeats <= 0;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <Card className="hover:shadow-lg transition-shadow bg-card overflow-hidden group">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 dark:bg-primary/30 p-2 rounded-full">
                                <Plane className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg leading-none">{sector.airline}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{sector.flightNumber}</p>
                            </div>
                        </div>
                        {isSoldOut ? (
                            <Badge variant="destructive" className="font-medium animate-pulse">Sold Out</Badge>
                        ) : (
                            <Badge variant="secondary" className="font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                                {sector.remainingSeats} Seats Left
                            </Badge>
                        )}
                    </div>

                    {sector.departureDate && (
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-3 bg-primary/5 w-fit px-3 py-1.5 rounded-md border border-primary/20">
                            <Calendar className="h-4 w-4" />
                            {sector.departureDate}
                        </div>
                    )}

                    <div className="flex justify-between items-center px-2 py-4 border-y border-border/50 bg-muted/20 relative">
                        <div className="text-center group-hover:transform group-hover:-translate-y-1 transition-transform">
                            <p className="text-3xl font-bold tracking-tight">{sector.originCode}</p>
                            <p className="text-sm text-muted-foreground">{sector.originCity}</p>
                            <p className="text-xs font-semibold mt-1">{sector.departureTime}</p>
                        </div>

                        <div className="flex-1 flex flex-col items-center px-4 relative">
                            <div className="flex items-center text-xs text-muted-foreground font-medium mb-2 gap-1 bg-background px-2 py-1 rounded-full border">
                                <Clock className="h-3 w-3" />
                                {sector.duration}
                            </div>
                            <div className="w-full border-t border-dashed border-primary/30 relative">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full w-2 h-2 border bg-background" />
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full w-2 h-2 border bg-background" />
                            </div>
                            <div className="flex flex-col items-center mt-2 gap-1 text-xs text-muted-foreground font-medium">
                                <span>Direct Flight</span>
                                {sector.baggage && (
                                    <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                        <Briefcase className="h-3 w-3" />
                                        {sector.baggage}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="text-center group-hover:transform group-hover:-translate-y-1 transition-transform">
                            <p className="text-3xl font-bold tracking-tight">{sector.destinationCode}</p>
                            <p className="text-sm text-muted-foreground">{sector.destinationCity}</p>
                            <p className="text-xs font-semibold mt-1">{sector.arrivalTime}</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/40 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Special Fare</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium">₹</span>
                            <span className="text-3xl font-extrabold text-primary">{sector.price.toLocaleString()}</span>
                        </div>
                    </div>
                    <Button
                        size="lg"
                        className="w-1/3 min-w-[120px] font-semibold text-md shadow-md"
                        disabled={isSoldOut}
                        onClick={() => onBook(sector)}
                    >
                        {isSoldOut ? "Closed" : "Book Now"}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
