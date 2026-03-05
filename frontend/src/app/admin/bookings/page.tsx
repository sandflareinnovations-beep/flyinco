"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, Ticket, XCircle, Search, RefreshCw, User, Phone, Mail, CreditCard, Plane } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

import { API_BASE, fetchWithCreds } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    HELD: "bg-violet-50 text-violet-700 border-violet-200",
    CANCELLED: "bg-red-50 text-red-600 border-red-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
};

async function fetchBookings() {
    return await fetchWithCreds('/bookings');
}

async function updateBookingStatus(id: string, status: string) {
    return await fetchWithCreds(`/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

export default function AdminBookings() {
    const { toast } = useToast();
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<any>(null);
    const [pnrInput, setPnrInput] = useState("");
    const [showDetail, setShowDetail] = useState(false);

    const { data: bookings = [], isLoading, refetch, isError } = useQuery({
        queryKey: ["admin-bookings"],
        queryFn: fetchBookings,
        refetchInterval: 30000,
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateBookingStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-bookings"] });
            toast({ title: "Status Updated" });
            setShowDetail(false);
        },
        onError: () => toast({ title: "Error", description: "Failed to update status.", variant: "destructive" }),
    });

    const filtered = bookings.filter((b: any) => {
        const q = search.toLowerCase();
        return (
            b.passengerName?.toLowerCase().includes(q) ||
            b.email?.toLowerCase().includes(q) ||
            b.phone?.toLowerCase().includes(q) ||
            b.route?.origin?.toLowerCase().includes(q) ||
            b.id?.toLowerCase().includes(q)
        );
    });

    // Metrics
    const totalRevenue = bookings.filter((b: any) => b.status !== "CANCELLED")
        .reduce((acc: number, b: any) => acc + (b.route?.price || 0), 0);
    const heldCount = bookings.filter((b: any) => b.status === "HELD").length;
    const confirmedCount = bookings.filter((b: any) => b.status === "CONFIRMED").length;

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Bookings</h1>
                    <p className="text-gray-400 text-sm mt-0.5">
                        {bookings.length} total bookings · {heldCount} held · {confirmedCount} confirmed
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search name, email, phone..."
                            className="pl-9 rounded-xl border-gray-200 focus-visible:ring-violet-400 text-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => refetch()}>
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Summary stat pills */}
            <div className="flex flex-wrap gap-3 text-sm">
                <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-2">
                    <span className="text-violet-500 font-medium">Total Revenue: </span>
                    <span className="font-black text-violet-700">SAR {totalRevenue.toLocaleString()}</span>
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
                    <p className="font-bold">Backend Connection Error</p>
                    <p>{(isError as any)?.message || "Could not connect to backend."}</p>
                    <p className="text-[10px] opacity-70 font-mono">Attempting to reach: {API_BASE}</p>
                    <p className="text-[10px] opacity-70">If the error is "Unauthorized", please Log Out and Log In again.</p>
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 border-gray-100">
                                {["#", "Passenger", "Contact", "Route", "Price", "Status", "Date", "Actions"].map(h => (
                                    <TableHead key={h} className="text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap py-3">
                                        {h}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((booking: any, i: number) => {
                                const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;
                                const route = booking.route;
                                return (
                                    <motion.tr
                                        key={booking.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="hover:bg-gray-50 border-gray-100 transition-colors"
                                    >
                                        <TableCell className="font-mono text-[11px] text-gray-400 py-3">
                                            #{booking.id.slice(0, 8).toUpperCase()}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <p className="font-semibold text-sm text-gray-900">{booking.passengerName}</p>
                                            <p className="text-xs text-gray-400 font-mono">{booking.passportNumber}</p>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <p className="text-xs text-gray-700">{booking.email}</p>
                                            <p className="text-xs text-gray-400">{booking.phone}</p>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {route ? (
                                                <span className="font-bold text-sm text-gray-800">
                                                    {route.origin} → {route.destination}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Unknown</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <span className="font-black text-violet-700 text-sm">
                                                SAR {(route?.price || 0).toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge variant="outline" className={`${statusStyle} font-semibold text-xs`}>
                                                {booking.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(booking.createdAt).toLocaleDateString('en-GB', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 w-7 p-0 rounded-lg hover:bg-violet-50 hover:text-violet-700"
                                                    title="View Details"
                                                    onClick={() => { setSelected(booking); setPnrInput(""); setShowDetail(true); }}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 w-7 p-0 rounded-lg hover:bg-emerald-50 hover:text-emerald-700"
                                                    title="Confirm / Issue PNR"
                                                    onClick={() => statusMutation.mutate({ id: booking.id, status: "CONFIRMED" })}
                                                >
                                                    <Ticket className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 w-7 p-0 rounded-lg hover:bg-red-50 hover:text-red-600"
                                                    title="Cancel Booking"
                                                    onClick={() => statusMutation.mutate({ id: booking.id, status: "CANCELLED" })}
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                );
                            })}
                            {filtered.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-gray-400 text-sm">
                                        {bookings.length === 0 ? "No bookings yet. Users will appear here after booking." : "No results for your search."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* ── Booking Detail Modal ── */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-lg">Booking Details</DialogTitle>
                        {selected && (
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                                #{selected.id.slice(0, 8).toUpperCase()} · {selected.status}
                            </p>
                        )}
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-4 py-2">
                            {/* Passenger info */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Passenger</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-violet-500" />
                                    <span className="font-semibold text-gray-900">{selected.passengerName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CreditCard className="h-4 w-4 text-violet-500" />
                                    <span className="text-gray-600 font-mono">{selected.passportNumber}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-violet-500" />
                                    <span className="text-gray-600">{selected.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-violet-500" />
                                    <span className="text-gray-600">{selected.phone}</span>
                                </div>
                            </div>

                            {/* Payment Info */}
                            {selected.transactionId && (
                                <div className="bg-amber-50 rounded-xl p-4 space-y-3">
                                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Payment Details</p>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-amber-700 font-medium">Transaction ID</span>
                                        <span className="font-mono font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-lg border border-amber-300">
                                            {selected.transactionId}
                                        </span>
                                    </div>
                                    {selected.paymentReceipt && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-amber-700 font-medium">Receipt</span>
                                                <a
                                                    href={selected.paymentReceipt}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-violet-600 font-semibold hover:underline"
                                                >
                                                    Open Full Image ↗
                                                </a>
                                            </div>
                                            <img
                                                src={selected.paymentReceipt}
                                                alt="Payment receipt"
                                                className="w-full rounded-xl border border-amber-200 object-contain max-h-56 bg-white shadow-sm"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Flight info */}
                            {selected.route && (
                                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Flight</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Plane className="h-4 w-4 text-violet-600" />
                                        <span className="font-bold text-violet-800">
                                            {selected.route.origin} → {selected.route.destination}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Price</span>
                                        <span className="font-black text-violet-700">SAR {(selected.route.price || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Travel Date</span>
                                        <span className="font-semibold text-gray-800">09 March 2026</span>
                                    </div>
                                </div>
                            )}

                            {/* Update status */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500">Update Status</Label>
                                <div className="flex gap-2">
                                    <Select
                                        defaultValue={selected.status}
                                        onValueChange={v => statusMutation.mutate({ id: selected.id, status: v })}
                                    >
                                        <SelectTrigger className="rounded-xl border-gray-200 focus:ring-violet-400 flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["PENDING", "HELD", "CONFIRMED", "CANCELLED"].map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Issue PNR */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500">Issue PNR / Ticket Number</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g. ABCDEF"
                                        className="rounded-xl border-gray-200 focus-visible:ring-violet-400 font-mono uppercase"
                                        value={pnrInput}
                                        onChange={e => setPnrInput(e.target.value.toUpperCase())}
                                    />
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold whitespace-nowrap"
                                        onClick={() => {
                                            if (pnrInput) {
                                                toast({ title: `PNR ${pnrInput} issued!`, description: `Booking #${selected.id.slice(0, 8).toUpperCase()}` });
                                                statusMutation.mutate({ id: selected.id, status: "CONFIRMED" });
                                            }
                                        }}
                                        disabled={!pnrInput}
                                    >
                                        <Ticket className="h-4 w-4 mr-1.5" /> Issue
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setShowDetail(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
