"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";
import { format } from "date-fns";

interface BookingReceiptProps {
    booking: any;
    onClose: () => void;
    autoPrint?: boolean;
}

export function BookingReceipt({ booking, onClose, autoPrint = false }: BookingReceiptProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const hasAutoPrinted = useRef(false);
    const route = booking.route;

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '', 'width=1000,height=900');
        if (!printWindow) return;

        printWindow.document.write('<html><head><title>Booking Itinerary - ' + (booking.passengerName || 'Customer') + '</title>');
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            @media print { 
                .no-print { display: none; } 
                body { padding: 0; margin: 0; } 
                @page { margin: 0.5cm; }
            }
            body { font-family: 'Inter', sans-serif; }
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body class="bg-white">');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // Wait for styles and images to load
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
            if (autoPrint) {
                onClose();
            }
        }, 800);
    };

    React.useEffect(() => {
        if (autoPrint && !hasAutoPrinted.current && booking && route) {
            hasAutoPrinted.current = true;
            // Short delay to ensure ref is populated
            setTimeout(handlePrint, 300);
        }
    }, [autoPrint, booking, route]);

    if (!booking || !route) return null;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Action Bar */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b no-print flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handlePrint}
                        className="rounded-xl gap-2 font-semibold bg-white shadow-sm border-gray-200"
                    >
                        <Printer className="h-4 w-4" /> Print Itinerary
                    </Button>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 animate-pulse">
                        ↓ Scroll to see full details
                    </span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Receipt Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent" ref={printRef} style={{ maxHeight: 'calc(85vh - 64px)' }}>
                <div className="max-w-[800px] mx-auto bg-white pb-12">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <img src="/logo.png" alt="Flyinco Logo" className="h-16 object-contain" />
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-black text-gray-900 uppercase">FLYINCO TRAVEL AND TOURISM CO</h2>
                            <p className="text-xs text-gray-500 max-w-[250px] ml-auto">Al Moosa Center Tower 3 Ground Floor office #42, Olaya St, Al Olaya, Riyadh 12212</p>
                            <p className="text-sm font-bold text-gray-700 mt-1">Phone: 055 618 2021</p>
                            <p className="text-sm text-gray-500">Email: info@flyinco.com</p>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="bg-[#1e1a4b] text-white text-center py-2 px-4 rounded-t-lg mb-6">
                        <h3 className="text-lg font-bold tracking-wider">Itinerary Details</h3>
                    </div>

                    {/* Passenger Details */}
                    <div className="mb-6 border border-gray-100 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-2 border-b border-gray-100 text-[10px] font-black text-[#1e1a4b] uppercase tracking-wider">
                            Passenger Details
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Passenger Name</p>
                                <p className="text-[13px] font-black text-gray-900 uppercase">{booking.passengerName}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Passport Number</p>
                                <p className="text-[13px] font-black text-gray-900">{booking.passportNumber || "---"}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Contact</p>
                                <p className="text-[13px] font-black text-gray-900">{booking.phone || booking.email || "---"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sector Info */}
                    <div className="mb-6 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-6 py-2 border-b border-gray-100 flex justify-between items-center text-[10px] font-black text-[#1e1a4b] uppercase tracking-wider">
                            <span>Flight Itinerary: {route.origin} → {route.destination}</span>
                        </div>
                        
                        <div className="p-4">
                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Airline</p>
                                    <div className="flex items-center gap-1.5 min-h-[20px]">
                                        <span className="font-bold text-gray-900 text-[12px] whitespace-nowrap">
                                            {route.airline === "Saudi Airlines" || route.airline === "Saudia Airlines" ? "Saudia Airlines" : route.airline}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Travel Class</p>
                                    <p className="font-bold text-gray-900 text-[11px]">Economy</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Check-In</p>
                                    <p className="font-bold text-gray-900 text-[11px]">{route.baggage || "2PC"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Cabin</p>
                                    <p className="font-bold text-gray-900 text-[11px]">7Kg</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-6 gap-2 border-t border-gray-100 pt-4">
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Flight</p>
                                    <p className="text-[12px] font-black text-gray-900 uppercase">{route.flightNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-black mb-1">From</p>
                                    <p className="text-[12px] font-black text-gray-900">{route.origin}</p>
                                    <p className="text-[10px] text-gray-500 whitespace-nowrap">{route.originCity}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Departure</p>
                                    <p className="text-[12px] font-black text-gray-900">{route.departureTime}</p>
                                    <p className="text-[10px] text-gray-500 whitespace-nowrap">{format(new Date(route.departureDate), 'dd MMM yy')}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Duration</p>
                                    <p className="text-[12px] font-black text-gray-900">{route.duration}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-black mb-1">To</p>
                                    <p className="text-[12px] font-black text-gray-900">{route.destination}</p>
                                    <p className="text-[10px] text-gray-500 whitespace-nowrap">{route.destinationCity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-emerald-600 uppercase font-black mb-1">Arrival</p>
                                    <p className="text-[12px] font-black text-gray-900">{route.arrivalTime}</p>
                                    <p className="text-[10px] text-emerald-700 font-bold whitespace-nowrap">
                                        {format(new Date(route.arrivalDate || route.departureDate), 'dd MMM yy')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fare Summary - Only show if not imported (isNew) */}
                    {!booking.isNew && (
                        <div className="mb-6 border border-gray-100 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-6 py-2 border-b border-gray-100 text-[10px] font-black text-[#1e1a4b] uppercase tracking-wider">
                                <span>Fare Summary</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[9px] text-gray-400 uppercase font-black text-left border-b border-gray-50">
                                        <th className="px-6 py-2">Pax Type</th>
                                        <th className="px-6 py-2">Base Fare</th>
                                        <th className="px-6 py-2">Tax & Charges</th>
                                        <th className="px-6 py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-50 text-[11px]">
                                        <td className="px-6 py-3 font-medium">Adult X 1</td>
                                        <td className="px-6 py-3">SAR {(booking.baseFare || 0).toLocaleString()}</td>
                                        <td className="px-6 py-3">SAR {((booking.taxes || 0) + (booking.serviceFee || 0)).toLocaleString()}</td>
                                        <td className="px-6 py-3 font-bold text-right">SAR {(booking.sellingPrice || 0).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50">
                                        <td colSpan={3} className="px-6 py-3 text-right font-black text-gray-500 text-[10px] uppercase">Total Gross Fare :</td>
                                        <td className="px-6 py-3 text-right font-black text-lg text-[#1e1a4b]">SAR {(booking.sellingPrice || 0).toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* Booking Reference */}
                    <div className={`grid ${booking.isNew && (!booking.ticketNumber || booking.ticketNumber === 'NOT ISSUED') ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-6`}>
                        <div className="bg-[#f0f4ff] p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                            <p className="text-[9px] text-blue-500 uppercase font-black mb-1 text-center">PNR / Reservation Code</p>
                            <p className="text-xl font-black font-mono text-blue-900 tracking-wider">
                                {booking.pnr || "PENDING"}
                            </p>
                        </div>
                        {!(booking.isNew && (!booking.ticketNumber || booking.ticketNumber === 'NOT ISSUED')) && (
                            <div className="bg-[#f0f4ff] p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                                <p className="text-[9px] text-blue-500 uppercase font-black mb-1 text-center">Ticket Number</p>
                                <p className="text-xl font-black font-mono text-blue-900 tracking-wider">
                                    {booking.ticketNumber || "NOT ISSUED"}
                                </p>
                            </div>
                        )}
                    </div>

                    {booking.refNo && (
                        <div className="mb-8 bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">FLYINCO REF NO</p>
                            <p className="text-sm font-black text-gray-800 tracking-widest">{booking.refNo}</p>
                        </div>
                    )}

                    {/* Footer branding */}
                    <div className="text-center pt-4 border-t border-gray-100">
                        <p className="text-[11px] text-gray-400 font-medium">Thank you for choosing Flyinco. Have a pleasant flight!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
