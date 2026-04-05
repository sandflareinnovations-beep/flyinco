"use client";
import { PiEye, PiMagnifyingGlass, PiPrinter, PiEnvelopeSimple, PiTicket } from "react-icons/pi";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

import { useState } from "react";
import { BookingReceipt } from "@/components/admin/booking-receipt";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

import { API_BASE, fetchWithCreds, flyApi } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    HELD: "bg-violet-50 text-violet-700 border-violet-200",
    CANCELLED: "bg-red-50 text-red-600 border-red-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function StaffBookings() {
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 50;
    const [selected, setSelected] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

    const { data: bookingData, isLoading, refetch, isError } = useQuery({
        queryKey: ["staff-bookings", page, search],
        queryFn: () => flyApi.bookings.listPaginated({ page, limit, search }),
        refetchInterval: 15000,
    });

    const bookings = bookingData?.bookings || [];
    const totalItems = bookingData?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);

    const { data: metrics } = useQuery({
        queryKey: ["staff-metrics"],
        queryFn: () => flyApi.bookings.getMetrics(),
        refetchInterval: 60000,
    });

    const heldCount = metrics?.heldCount || 0;
    const confirmedCount = metrics?.confirmedCount || 0;

    const handleSendItinerary = async (bookingId: string, email?: string) => {
        try {
            await fetchWithCreds(`/bookings/${bookingId}/send-itinerary`, {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            toast({ title: "Itinerary Sent", description: "Itinerary email sent successfully." });
        } catch (err: any) {
            toast({ title: "Error", description: err?.message || "Failed to send itinerary.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Bookings</h1>
                    <p className="text-gray-400 text-sm mt-0.5">
                        {totalItems} total bookings · {heldCount} held · {confirmedCount} confirmed
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 min-w-[280px]">
                        <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search name, passport, PNR..."
                            className="pl-9 rounded-xl border-gray-200 focus-visible:ring-violet-400 text-sm h-10"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => refetch()}>
                        <PiTicket className="h-3.5 w-3.5" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Summary stat pills */}
            <div className="flex flex-wrap gap-3 text-sm">
                <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-2">
                    <span className="text-violet-500 font-medium">Total: </span>
                    <span className="font-black text-violet-700">{totalItems}</span>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
                    <span className="text-amber-500 font-medium">Held: </span>
                    <span className="font-black text-amber-700">{heldCount}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
                    <span className="text-emerald-500 font-medium">Confirmed: </span>
                    <span className="font-black text-emerald-700">{confirmedCount}</span>
                </div>
            </div>

            {/* Error state */}
            {isError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 space-y-1">
                    <p className="font-bold">Connection Error</p>
                    <p>Could not connect to backend. Please try again.</p>
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 border-gray-100">
                                {["#", "Passenger", "Passport", "Route", "Travel Date", "Airline", "Status", "Payment", "PNR", "Actions"].map((h) => (
                                    <TableHead key={h} className="text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap py-3">
                                        {h}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-32 text-center text-gray-400">
                                        No bookings found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bookings.map((booking: any, i: number) => {
                                    const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;
                                    const route = booking.route;
                                    return (
                                        <motion.tr
                                            key={booking.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="hover:bg-gray-50 border-gray-100 transition-colors"
                                        >
                                            <TableCell className="font-mono text-[11px] text-gray-400 py-3">
                                                {(page - 1) * limit + i + 1}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <p className="font-semibold text-sm text-gray-900">{booking.passengerName}</p>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-gray-500">
                                                {booking.passportNumber || "---"}
                                            </TableCell>
                                            <TableCell>
                                                {route ? (
                                                    <span className="text-sm font-semibold text-gray-800">
                                                        {route.origin} → {route.destination}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                                {booking.travelDate
                                                    ? format(new Date(booking.travelDate), "dd MMM yy")
                                                    : route?.departureDate
                                                    ? format(new Date(route.departureDate), "dd MMM yy")
                                                    : "N/A"}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {route?.airline || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${statusStyle} text-[10px] font-bold border`}>
                                                    {booking.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-bold border ${
                                                        booking.paymentStatus === "PAID"
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : "bg-red-50 text-red-600 border-red-200"
                                                    }`}
                                                >
                                                    {booking.paymentStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-violet-700 font-bold">
                                                {booking.pnr || "---"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                                                        onClick={() => {
                                                            setSelected(booking);
                                                            setShowDetail(true);
                                                        }}
                                                        title="View Details"
                                                    >
                                                        <PiEye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                                                        onClick={() => {
                                                            setSelected(booking);
                                                            setShowReceipt(true);
                                                        }}
                                                        title="Print Itinerary"
                                                    >
                                                        <PiPrinter className="h-4 w-4" />
                                                    </Button>
                                                    {booking.email && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                            onClick={() => handleSendItinerary(booking.id, booking.email)}
                                                            title="Send Itinerary Email"
                                                        >
                                                            <PiEnvelopeSimple className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                        Page {page} of {totalPages} · {totalItems} bookings
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* ─── VIEW DETAIL DIALOG (Read-Only) ─── */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black">Booking Details</DialogTitle>
                        <DialogDescription className="text-xs text-gray-400">
                            View-only booking information.
                        </DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Passenger</p>
                                    <p className="font-semibold text-gray-900">{selected.passengerName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Passport</p>
                                    <p className="font-mono text-gray-700">{selected.passportNumber || "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Nationality</p>
                                    <p className="text-gray-700">{selected.nationality || "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Gender</p>
                                    <p className="text-gray-700">{selected.gender || "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Phone</p>
                                    <p className="text-gray-700">{selected.phone || "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Email</p>
                                    <p className="text-gray-700">{selected.email || "---"}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Route</p>
                                    <p className="font-semibold text-gray-900">
                                        {selected.route ? `${selected.route.origin} → ${selected.route.destination}` : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Airline</p>
                                    <p className="text-gray-700">{selected.route?.airline || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Travel Date</p>
                                    <p className="text-gray-700">
                                        {selected.travelDate
                                            ? format(new Date(selected.travelDate), "dd MMM yyyy")
                                            : selected.route?.departureDate
                                            ? format(new Date(selected.route.departureDate), "dd MMM yyyy")
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Flight</p>
                                    <p className="font-mono text-gray-700">{selected.route?.flightNumber || "N/A"}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-3">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">PNR</p>
                                    <p className="font-mono font-bold text-violet-700">{selected.pnr || "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Ticket No</p>
                                    <p className="font-mono text-gray-700">{selected.ticketNumber || "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Status</p>
                                    <Badge variant="outline" className={`${STATUS_STYLES[selected.status] || ""} text-[10px] font-bold`}>
                                        {selected.status}
                                    </Badge>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-3 flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl gap-1.5"
                                    onClick={() => {
                                        setShowDetail(false);
                                        setShowReceipt(true);
                                    }}
                                >
                                    <PiPrinter className="h-4 w-4" /> Print Itinerary
                                </Button>
                                {selected.email && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl gap-1.5"
                                        onClick={() => handleSendItinerary(selected.id, selected.email)}
                                    >
                                        <PiEnvelopeSimple className="h-4 w-4" /> Send Itinerary
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ─── RECEIPT / ITINERARY DIALOG ─── */}
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 rounded-2xl overflow-hidden">
                    {selected && (
                        <BookingReceipt booking={selected} onClose={() => setShowReceipt(false)} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
