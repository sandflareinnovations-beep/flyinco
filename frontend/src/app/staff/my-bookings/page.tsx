"use client";
import { PiBookOpen, PiMagnifyingGlass, PiEye, PiPrinter, PiClock, PiCheckCircle, PiXCircle } from "react-icons/pi";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { flyApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BookingReceipt } from "@/components/admin/booking-receipt";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    HELD: "bg-violet-50 text-violet-700 border-violet-200",
    CANCELLED: "bg-red-50 text-red-600 border-red-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
};

type FilterType = "all" | "CONFIRMED" | "HELD" | "PENDING" | "CANCELLED";

export default function StaffMyBookingsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState<FilterType>("all");
    const [selected, setSelected] = useState<any>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const { toast } = useToast();
    const limit = 50;

    // Get current staff user with useEffect to avoid SSR issues
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                setCurrentUser(JSON.parse(stored));
            } catch {}
        }
    }, []);

    const { data: bookingData, isLoading, refetch } = useQuery({
        queryKey: ["staff-my-bookings", page, search, filter],
        queryFn: () => flyApi.bookings.listPaginated({ page, limit, search }),
        refetchInterval: 15000,
    });

    const bookings = bookingData?.bookings || [];
    const totalItems = bookingData?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Filter bookings to show only current staff's bookings
    const staffBookings = bookings.filter((b: any) => {
        // Show staff-created bookings
        if (b.agentDetails?.startsWith("Staff:")) {
            return true;
        }
        return false;
    });

    // Apply status filter
    const filteredBookings = filter === "all" 
        ? staffBookings 
        : staffBookings.filter((b: any) => b.status === filter);

    const getStatusBadge = (status: string) => (
        <Badge variant="outline" className={STATUS_STYLES[status] || STATUS_STYLES.PENDING}>
            {status}
        </Badge>
    );

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">My Bookings</h1>
                    <p className="text-gray-400 text-sm mt-0.5">
                        {totalItems} total bookings · Showing {filteredBookings.length} bookings
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
                        <PiClock className="h-3.5 w-3.5" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {(["all", "CONFIRMED", "HELD", "PENDING", "CANCELLED"] as FilterType[]).map((f) => (
                    <Button
                        key={f}
                        variant={filter === f ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(f)}
                        className="rounded-xl text-xs"
                        style={filter === f ? { background: "#2E0A57" } : {}}
                    >
                        {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                    </Button>
                ))}
            </div>

            {/* Bookings Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <PiBookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-gray-900">No Bookings Found</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        {search ? "No bookings match your search." : "You haven't created any bookings yet."}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Passenger</TableHead>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Contact</TableHead>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Route</TableHead>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Sale Price</TableHead>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Status</TableHead>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Travel Date</TableHead>
                                <TableHead className="text-right text-xs font-black text-gray-500 uppercase">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBookings.map((booking: any) => {
                                const route = booking.route;
                                return (
                                    <TableRow key={booking.id} className="hover:bg-gray-50">
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm text-gray-900">{booking.passengerName}</p>
                                            </div>
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
                                            <span className="text-sm font-bold text-emerald-600">
                                                SAR {booking.sellingPrice?.toLocaleString() || 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {getStatusBadge(booking.status)}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <span className="text-xs text-gray-600">
                                                {booking.travelDate 
                                                    ? format(new Date(booking.travelDate), 'dd MMM yyyy')
                                                    : route?.departureDate 
                                                        ? format(new Date(route.departureDate), 'dd MMM yyyy')
                                                        : '-'
                                                }
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => { setSelected(booking); setShowReceipt(true); }}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <PiEye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Page {page} of {totalPages} ({totalItems} bookings)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="rounded-xl"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="rounded-xl"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Booking Details</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <BookingReceipt 
                            booking={selected} 
                            onClose={() => setShowReceipt(false)} 
                            showFare={true}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
