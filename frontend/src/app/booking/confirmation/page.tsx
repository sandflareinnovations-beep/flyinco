"use client";
import { PiCheckCircle, PiAirplaneTilt, PiArrowRight, PiHouse, PiClipboardText, PiCopy, PiCheck } from "react-icons/pi";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ConfirmationPage() {
    const router = useRouter();
    const [booking, setBooking] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const data = sessionStorage.getItem('bookingConfirmation');
        if (data) setBooking(JSON.parse(data));
    }, []);

    const copyRef = () => {
        navigator.clipboard.writeText(booking.bookingRef);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!booking) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <p className="text-gray-400 mb-4">No booking found.</p>
                <Button onClick={() => router.push('/')} className="text-white rounded-xl shadow-lg" style={{ backgroundColor: '#2E0A57' }}>Browse Fares</Button>
            </div>
        </div>
    );

    const flight = booking.flight;
    const firstSeg = flight?.segments?.[0];
    const lastSeg = flight?.segments?.[flight.segments.length - 1];

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-full max-w-lg"
            >
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Success banner */}
                    <div className="p-8 text-white text-center" style={{ backgroundColor: '#2E0A57' }}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <PiCheckCircle className="h-9 w-9 text-white" />
                        </motion.div>
                        <h1 className="text-2xl font-black mb-1">
                            {booking.status === "PENDING" ? "Payment Submitted!" : "Booking Held!"}
                        </h1>
                        <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: '#EDE9FE' }}>
                            {booking.status === "PENDING" ? "Your payment is being verified for instant approval and PNR issuance." : "Your seat has been held with instant approval. Your PNR will be sent shortly."}
                        </p>
                    </div>

                    <div className="p-7 space-y-5">
                        {/* Booking Reference */}
                        <div className="bg-gray-50 rounded-2xl p-4 text-center">
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1.5">Booking Reference</p>
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-2xl font-black font-mono tracking-widest" style={{ color: '#2E0A57' }}>{booking.bookingRef}</p>
                                <button onClick={copyRef} className="text-gray-400 hover:text-[#6C2BD9] transition-colors">
                                    {copied ? <PiCheck className="h-4 w-4 text-emerald-500" /> : <PiCopy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Flight details */}
                        {flight && firstSeg && lastSeg && (
                            <div className="space-y-2.5">
                                {[
                                    { label: "Route", value: <span className="flex items-center gap-1 font-bold">{firstSeg.departureAirport} <PiArrowRight className="h-3 w-3 text-gray-400" /> {lastSeg.arrivalAirport}</span> },
                                    { label: "Flight", value: <span className="font-mono font-semibold">{flight.segments.map((s: any) => s.flightNumber).join(' + ')}</span> },
                                    { label: "Date", value: new Date(flight.departureDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) },
                                    { label: "Email", value: booking.email },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">{label}</span>
                                        <span className="text-gray-900">{value}</span>
                                    </div>
                                ))}
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-black" style={{ color: '#2E0A57' }}>SAR {booking.totalPrice?.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {/* Info */}
                        <div className="rounded-xl p-3.5 text-sm flex gap-2.5 border border-[#EDE9FE] bg-[#F5F3FF]" style={{ color: '#2E0A57' }}>
                            <PiAirplaneTilt className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>Our team provides instant approval and will finalize PNR and ticket issuance immediately.</span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2.5 pt-1">
                            <Button
                                className="w-full text-white font-bold rounded-xl h-11 gap-2 shadow-lg"
                                style={{ backgroundColor: '#2E0A57' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3B0F70')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2E0A57')}
                                onClick={() => router.push('/dashboard')}
                            >
                                <PiClipboardText className="h-4 w-4" />
                                View My Bookings
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full rounded-xl h-11 gap-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                                onClick={() => router.push('/')}
                            >
                                <PiHouse className="h-4 w-4" />
                                Return Home
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
