"use client";
import { PiAirplaneTilt, PiClock, PiSuitcaseRolling, PiWarningCircle, PiCaretRight } from "react-icons/pi";
import { motion } from "framer-motion";
import { FlightOption } from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

const BRAND = "#2E0A57";
const BRAND_HOVER = "#3B0F70";
const BRAND_ACCENT = "#6C2BD9";

interface FlightCardProps {
    flight: any; // using any since we replaced strict mock type with single object
    routeId: string;
    index?: number;
}

export function FlightCard({ flight, routeId, index = 0 }: FlightCardProps) {
    const router = useRouter();
    const isLowSeats = flight.remainingSeats <= 5 && flight.remainingSeats > 0;
    const firstSeg = flight.segments[0];
    const lastSeg = flight.segments[flight.segments.length - 1];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="bg-white rounded-[24px] border border-gray-100 transition-all overflow-hidden"
            style={{ boxShadow: "0 4px 24px rgba(46,10,87,0.06), 0 1px 4px rgba(0,0,0,0.03)" }}
        >
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">

                    {/* ── Airline Info & Saudia Logo ── */}
                    <div className="w-full md:w-56 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div style={{
                                width: 48, height: 48, borderRadius: 12,
                                background: "#F3F0FF", display: "flex",
                                alignItems: "center", justifyContent: "center",
                                overflow: "hidden",
                            }}>
                                {flight.airlineLogo ? (
                                    <img src={flight.airlineLogo} alt={firstSeg.airline} width={40} height={40} style={{ objectFit: 'contain' }} />
                                ) : (
                                    <PiAirplaneTilt size={24} style={{ color: BRAND_ACCENT }} />
                                )}
                            </div>
                            <div>
                                <p style={{ fontWeight: 800, fontSize: 15, color: "#111827", letterSpacing: "-0.01em" }}>
                                    {firstSeg.airline}
                                </p>
                                <p style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "monospace", marginTop: 2 }}>
                                    {firstSeg.flightNumber}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Timeline ── */}
                    <div className="flex-1 flex items-center gap-5">
                        <div style={{ minWidth: 60 }}>
                            <p style={{ fontSize: 26, fontWeight: 900, color: BRAND, letterSpacing: "-0.04em", lineHeight: 1 }}>
                                {firstSeg.departureAirport}
                            </p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginTop: 4 }}>
                                {firstSeg.departureTime}
                            </p>
                            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{firstSeg.departureCity}</p>
                        </div>

                        <div className="flex-1 flex flex-col items-center gap-1 min-w-[100px]">
                            <div className="flex items-center w-full gap-2">
                                <div style={{ flex: 1, height: 2, background: "#F3F4F6", borderRadius: 2 }} />
                                <PiAirplaneTilt size={14} style={{ color: BRAND_ACCENT }} />
                                <div style={{ flex: 1, height: 2, background: "#F3F4F6", borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: flight.layover ? "#F59E0B" : "#10B981" }}>
                                {flight.layover ? "One Stop" : "Direct"}
                            </span>
                        </div>

                        <div className="text-right" style={{ minWidth: 60 }}>
                            <p style={{ fontSize: 26, fontWeight: 900, color: BRAND, letterSpacing: "-0.04em", lineHeight: 1 }}>
                                {lastSeg.arrivalAirport}
                            </p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginTop: 4 }}>
                                {lastSeg.arrivalTime}
                            </p>
                            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{lastSeg.arrivalCity}</p>
                        </div>
                    </div>

                    {/* ── Baggage & Flight Details ── */}
                    <div className="hidden md:flex flex-col items-center gap-1.5 w-24 flex-shrink-0">
                        <div style={{ background: "#F9FAFB", padding: "6px 12px", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                            <PiSuitcaseRolling size={16} color="#6B7280" />
                            <span style={{ fontSize: 10, color: "#4B5563", fontWeight: 700, marginTop: 4, textAlign: "center", whiteSpace: "nowrap" }}>
                                {flight.baggage}
                            </span>
                        </div>
                        {flight.layover && (
                            <div style={{ fontSize: 10, color: BRAND_ACCENT, fontWeight: 700, background: "#F3F0FF", padding: "4px 8px", borderRadius: 6, width: "100%", textAlign: "center", whiteSpace: "nowrap" }}>
                                {flight.layover}
                            </div>
                        )}
                        {flight.flightRules && (
                            <div style={{ fontSize: 9, color: "#6B7280", fontWeight: 500, border: "1px dashed #E5E7EB", padding: "4px 8px", borderRadius: 6, width: "100%", textAlign: "center" }}>
                                {flight.flightRules}
                            </div>
                        )}
                        {flight.flightDetails && (
                            <div style={{ fontSize: 9, color: "#9CA3AF", textAlign: "center" }}>
                                {flight.flightDetails}
                            </div>
                        )}
                    </div>

                    {/* ── Pricing & CTA ── */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 flex-shrink-0 min-w-[140px]">
                        <div className="text-left md:text-right">
                            <p style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2, fontWeight: 600 }}>
                                Price
                            </p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: BRAND }}>SAR</span>
                                <span style={{ fontSize: 32, fontWeight: 900, color: BRAND, letterSpacing: "-0.04em", lineHeight: 1 }}>
                                    {(flight.price || 1300).toLocaleString()}
                                </span>
                            </div>
                            {isLowSeats && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FEF2F2", color: "#DC2626", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, marginTop: 4 }}>
                                    <PiWarningCircle size={10} /> {flight.remainingSeats} seats left
                                </span>
                            )}
                        </div>

                        <button
                            style={{
                                background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_ACCENT} 100%)`,
                                color: "white", padding: "10px 24px", borderRadius: 10,
                                fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 6,
                                boxShadow: `0 4px 14px ${BRAND}44`,
                                transition: "transform 0.2s ease, box-shadow 0.2s ease"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.boxShadow = `0 6px 20px ${BRAND}66`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = `0 4px 14px ${BRAND}44`;
                            }}
                            onClick={() => {
                                // Save flight selection to session for passenger form
                                sessionStorage.setItem("selectedFlight", JSON.stringify(flight));
                                router.push(`/booking/passengers?flightId=${flight.id}&routeId=${routeId}`);
                            }}
                        >
                            Select <PiCaretRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
