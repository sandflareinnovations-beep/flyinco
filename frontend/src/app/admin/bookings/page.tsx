"use client";
import { PiEye, PiTicket, PiMagnifyingGlass, PiUser, PiPhone, PiEnvelopeSimple, PiCreditCard, PiAirplaneTilt, PiTrash, PiWarning, PiPlus, PiFileText, PiTable } from "react-icons/pi";
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
import { format } from "date-fns";
import * as XLSX from "xlsx";

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

async function fetchBookings({ page = 1, limit = 50, search = '', agent = '', phone = '' }) {
    return await flyApi.bookings.listPaginated({ page, limit, search, agent, phone });
}

async function fetchMetrics() {
    return await flyApi.bookings.getMetrics();
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
    const [searchType, setSearchType] = useState("all");
    const [page, setPage] = useState(1);
    const limit = 50;
    const [selected, setSelected] = useState<any>(null);
    const [pnrInput, setPnrInput] = useState("");
    const [showDetail, setShowDetail] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [ticketFile, setTicketFile] = useState<File | null>(null);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importResults, setImportResults] = useState<any>(null);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkDelete, setShowBulkDelete] = useState(false);

    // Add state
    const [addData, setAddData] = useState({
        routeId: "",
        passengerName: "",
        passportNumber: "",
        email: "",
        phone: "",
        sellingPrice: 0,
        purchasePrice: 0,
        baseFare: 0,
        taxes: 0,
        serviceFee: 0,
        pnr: "",
        ticketNumber: "",
    });

    const { data: routeData } = useQuery({
        queryKey: ["admin-routes"],
        queryFn: () => flyApi.sectors.list(),
    });
    const routes = Array.isArray(routeData) ? routeData : (routeData?.routes || []);

    // Accounting states
    const [accData, setAccData] = useState({
        purchasePrice: 0,
        sellingPrice: 0,
        baseFare: 0,
        taxes: 0,
        serviceFee: 0,
        ticketNumber: "",
        paymentStatus: "UNPAID",
        prefix: "",
        givenName: "",
        surname: "",
        airline: "",
        sector: "",
        travelDate: "",
        supplier: "",
        agencyEmail: "",
        paymentMethod: "",
        request: "",
        remarks: "",
        agentDetails: "",
        email: "",
    });

    const { data: bookingData, isLoading, refetch, isError } = useQuery({
        queryKey: ["admin-bookings", page, search, searchType],
        queryFn: () => fetchBookings({ 
            page, 
            limit, 
            search: searchType === "all" ? search : "",
            agent: searchType === "agent" ? search : "",
            phone: searchType === "phone" ? search : ""
        }),
        refetchInterval: 15000, // Refresh every 15 seconds to sync with latest bookings
    });

    const bookings = bookingData?.bookings || [];
    const totalItems = bookingData?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);

    const { data: metrics } = useQuery({
        queryKey: ["admin-metrics"],
        queryFn: fetchMetrics,
        refetchInterval: 60000,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => fetchWithCreds(`/bookings/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-bookings"] });
            toast({ title: "Booking Updated", description: "All changes saved successfully." });
        },
        onError: () => toast({ title: "Error", description: "Failed to update booking.", variant: "destructive" }),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => fetchWithCreds('/bookings', {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-bookings"] });
            toast({ title: "Booking Created", description: "Manual booking added successfully." });
            setShowAdd(false);
            setAddData({
                routeId: "", passengerName: "", passportNumber: "", email: "", phone: "",
                sellingPrice: 0, purchasePrice: 0, baseFare: 0, taxes: 0, serviceFee: 0, pnr: "", ticketNumber: ""
            });
        },
        onError: () => toast({ title: "Error", description: "Failed to create booking.", variant: "destructive" }),
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

    const sendTicketMutation = useMutation({
        mutationFn: async ({ id, file }: { id: string; file: File }) => {
            const formData = new FormData();
            formData.append("ticket", file);

            const token = localStorage.getItem('token') || document.cookie.match(/(^| )token=([^;]+)/)?.[2] || '';
            const res = await fetch(`${API_BASE}/bookings/${id}/send-ticket`, {
                method: "POST",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to send ticket");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Ticket sent successfully!" });
            setTicketFile(null);
        },
        onError: () => toast({ title: "Error", description: "Failed to send ticket.", variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => fetchWithCreds(`/bookings/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-bookings"] });
            toast({ title: "Booking Deleted", description: "The record has been permanently removed." });
            setShowDelete(false);
        },
        onError: (err: any) => toast({
            title: "Error",
            description: err.message || "Failed to delete booking.",
            variant: "destructive"
        }),
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => fetchWithCreds(`/bookings/bulk`, { 
            method: "DELETE",
            body: JSON.stringify({ ids }),
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-bookings"] });
            toast({ title: "Bookings Deleted", description: "Selected records have been permanently removed." });
            setShowBulkDelete(false);
            setSelectedIds([]);
        },
        onError: (err: any) => toast({
            title: "Error",
            description: err.message || "Failed to delete bookings.",
            variant: "destructive"
        }),
    });

    const bulkImportMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            const token = localStorage.getItem('token') || document.cookie.match(/(^| )token=([^;]+)/)?.[2] || '';
            const res = await fetch(`${API_BASE}/bookings/bulk-import`, {
                method: "POST",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData,
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to import bookings");
            }
            return res.json();
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["admin-bookings"] });
            setImportResults(data);
            toast({ 
                title: "Import Complete", 
                description: `Successfully imported ${data.success} bookings. ${data.failed} failed.` 
            });
        },
        onError: (err: any) => toast({
            title: "Import Error",
            description: err.message,
            variant: "destructive"
        }),
    });

    const sendItineraryMutation = useMutation({
        mutationFn: async ({ id, email }: { id: string, email: string }) => {
            return fetchWithCreds(`/bookings/${id}/send-itinerary`, {
                method: "POST",
                body: JSON.stringify({ email })
            });
        },
        onSuccess: (data) => {
            toast({ title: "Itinerary Sent", description: data.message });
            setShowEmailDialog(false);
        },
        onError: (err: any) => toast({
            title: "Error",
            description: err.message || "Failed to send itinerary.",
            variant: "destructive"
        }),
    });

    const handleExportAll = () => {
        const data = bookings.map((b: any) => ({
            ID: b.id,
            Date: b.createdAt ? format(new Date(b.createdAt), 'dd-MM-yyyy') : 'N/A',
            Passenger: b.passengerName,
            Passport: b.passportNumber || 'N/A',
            Phone: b.phone || 'N/A',
            Email: b.email || 'N/A',
            PNR: b.pnr || 'N/A',
            Ticket: b.ticketNumber || 'N/A',
            Airline: b.airline || b.route?.airline || 'N/A',
            Sector: b.sector || (b.route ? `${b.route.origin}-${b.route.destination}` : 'N/A'),
            Travel_Date: b.travelDate ? format(new Date(b.travelDate), 'dd-MM-yyyy') : (b.route?.departureDate ? format(new Date(b.route.departureDate), 'dd-MM-yyyy') : 'N/A'),
            Agent: b.agentDetails || b.user?.name || 'N/A',
            Supplier: b.supplier || 'N/A',
            Status: b.status,
            Payment: b.paymentStatus,
            Sale_Price: b.sellingPrice || b.route?.price || 0,
            Net_Price: b.purchasePrice || 0,
            Profit: b.profit || 0,
            PNR_Reservation: b.pnr || 'N/A', // Re-adding with clearer header
            Ticket_No: b.ticketNumber || 'N/A',
            Remarks: b.remarks || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "All_Bookings");
        XLSX.writeFile(wb, `Flyinco_Bookings_Report.xlsx`);
    };

    const filtered = bookings; // Server-side filtered already

    // Metrics from server
    const totalRevenue = metrics?.totalRevenue || 0;
    const totalProfit = metrics?.totalProfit || 0;
    const heldCount = metrics?.heldCount || 0;
    const confirmedCount = metrics?.confirmedCount || 0;

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
                    {selectedIds.length > 0 && (
                        <Button 
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-1.5"
                            onClick={() => setShowBulkDelete(true)}
                        >
                            <PiTrash className="h-4 w-4" /> Delete ({selectedIds.length})
                        </Button>
                    )}
                    <Button 
                        className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-1.5"
                        onClick={() => setShowAdd(true)}
                    >
                        <PiPlus className="h-4 w-4" /> Add Booking
                    </Button>
                    <Button 
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl gap-1.5"
                        onClick={() => setShowBulkImport(true)}
                    >
                        <PiTable className="h-4 w-4" /> Bulk Import
                    </Button>
                    <Button 
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl gap-1.5"
                        onClick={handleExportAll}
                    >
                        <PiTicket className="h-4 w-4" /> Export Report
                    </Button>
                    <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                        <Select value={searchType} onValueChange={v => { setSearchType(v); setPage(1); }}>
                            <SelectTrigger className="w-[120px] rounded-xl border-gray-200 focus:ring-violet-400 text-xs h-10">
                                <SelectValue placeholder="Search By" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Fields</SelectItem>
                                <SelectItem value="agent">Agent Name</SelectItem>
                                <SelectItem value="phone">Phone Number</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                            <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={
                                    searchType === "agent" ? "Enter agent name..." :
                                    searchType === "phone" ? "Enter phone number..." :
                                    "Search name, email, PNR..."
                                }
                                className="pl-9 rounded-xl border-gray-200 focus-visible:ring-violet-400 text-sm h-10"
                                value={search}
                                onChange={e => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => refetch()}>
                        <PiTicket className="h-3.5 w-3.5" /> Refresh
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
                    <span className="text-emerald-500 font-medium">Profit: </span>
                    <span className="font-black text-emerald-700">SAR {totalProfit.toLocaleString()}</span>
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
                                <TableHead className="w-10">
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                        checked={filtered.length > 0 && selectedIds.length === filtered.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedIds(filtered.map((b: any) => b.id));
                                            } else {
                                                setSelectedIds([]);
                                            }
                                        }}
                                    />
                                </TableHead>
                                {["#", "Passenger / Agent", "Contact", "Route", "Sale Price", "Profit", "Status", "Travel Date", "Actions"].map(h => (
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
                                const isSelected = selectedIds.includes(booking.id);
                                return (
                                    <motion.tr
                                        key={booking.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.04 }}
                                        className={`hover:bg-gray-50 border-gray-100 transition-colors ${isSelected ? 'bg-violet-50' : ''}`}
                                    >
                                        <TableCell>
                                            <input 
                                                type="checkbox" 
                                                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds([...selectedIds, booking.id]);
                                                    } else {
                                                        setSelectedIds(selectedIds.filter(id => id !== booking.id));
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono text-[11px] text-gray-400 py-3">
                                            #{booking.id.slice(0, 8).toUpperCase()}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm text-gray-900">{booking.passengerName}</p>
                                            </div>
                                            <p className="text-xs text-gray-400 font-mono">{booking.passportNumber}</p>
                                            {(booking.agentDetails || booking.user?.name) && (
                                                <Badge variant="outline" className="mt-1 border-violet-200 text-violet-600 bg-violet-50 text-[10px] py-0">
                                                    Agent: {booking.agentDetails || booking.user?.name || 'Unknown'}
                                                </Badge>
                                            )}
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
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className="font-black text-violet-700 text-sm">
                                                    SAR {(booking.sellingPrice || route?.price || 0).toLocaleString()}
                                                </span>
                                                <Badge variant="outline" className={`text-[9px] py-0 h-4 ${booking.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                                    {booking.paymentStatus || 'UNPAID'}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <span className={`font-bold text-sm ${ (booking.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                SAR {(booking.profit || 0).toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge variant="outline" className={`${statusStyle} font-semibold text-xs`}>
                                                {booking.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-xs text-gray-400 whitespace-nowrap font-medium text-emerald-700">
                                            {booking.travelDate 
                                                ? new Date(booking.travelDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                                                : route?.departureDate 
                                                    ? new Date(route.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                                                    : "N/A"}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 w-7 p-0 rounded-lg hover:bg-violet-50 hover:text-violet-700"
                                                    title="View Details"
                                                    onClick={() => {
                                                        setSelected(booking);
                                                        setPnrInput(booking.pnr || "");
                                                        setAccData({
                                                            purchasePrice: booking.purchasePrice || 0,
                                                            sellingPrice: booking.sellingPrice || booking.route?.price || 0,
                                                            baseFare: booking.baseFare || 0,
                                                            taxes: booking.taxes || 0,
                                                            serviceFee: booking.serviceFee || 0,
                                                            ticketNumber: booking.ticketNumber || "",
                                                            paymentStatus: booking.paymentStatus || "UNPAID",
                                                            prefix: booking.prefix || "",
                                                            givenName: booking.givenName || "",
                                                            surname: booking.surname || "",
                                                            airline: booking.airline || "",
                                                            sector: booking.sector || "",
                                                            travelDate: booking.travelDate ? new Date(booking.travelDate).toISOString().split('T')[0] : "",
                                                            supplier: booking.supplier || "",
                                                            agencyEmail: booking.agencyEmail || "",
                                                            paymentMethod: booking.paymentMethod || "",
                                                            request: booking.request || "",
                                                            remarks: booking.remarks || "",
                                                            agentDetails: booking.agentDetails || "",
                                                            email: booking.email || "",
                                                        });
                                                        setShowDetail(true);
                                                    }}
                                                >
                                                    <PiEye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 w-7 p-0 rounded-lg hover:bg-emerald-50 hover:text-emerald-700"
                                                    title="Confirm / Issue PNR"
                                                    onClick={() => statusMutation.mutate({ id: booking.id, status: "CONFIRMED" })}
                                                >
                                                    <PiTicket className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 w-7 p-0 rounded-lg hover:bg-red-50 hover:text-red-600"
                                                    title="Cancel Booking"
                                                    onClick={() => statusMutation.mutate({ id: booking.id, status: "CANCELLED" })}
                                                >
                                                    <PiTicket className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 w-7 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-700"
                                                    title="View Itinerary / Receipt"
                                                    onClick={() => {
                                                        setSelected(booking);
                                                        setShowReceipt(true);
                                                    }}
                                                >
                                                    <PiFileText className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 w-7 p-0 rounded-lg hover:bg-orange-50 hover:text-orange-700"
                                                    title="Email Itinerary"
                                                    onClick={() => {
                                                        setSelected(booking);
                                                        setEmailInput(booking.email || "");
                                                        setShowEmailDialog(true);
                                                    }}
                                                >
                                                    <PiEnvelopeSimple className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-7 w-7 p-0 rounded-lg hover:bg-red-100 hover:text-red-700"
                                                    title="Delete Permanently"
                                                    onClick={() => {
                                                        setDeletingId(booking.id);
                                                        setShowDelete(true);
                                                    }}
                                                >
                                                    <PiTrash className="h-3.5 w-3.5 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                );
                            })}
                            {filtered.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-32 text-center text-gray-400 text-sm">
                                        {bookings.length === 0 ? "No bookings yet. Users will appear here after booking." : "No results for your search."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
                                Showing <span className="text-gray-900 font-bold">{(page - 1) * limit + 1}</span> to{" "}
                                <span className="text-gray-900 font-bold">{Math.min(page * limit, totalItems)}</span> of{" "}
                                <span className="text-gray-900 font-bold">{totalItems}</span> bookings
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="rounded-xl h-9 px-4 border-gray-200 hover:bg-white hover:text-violet-600 transition-all text-xs font-bold"
                                >
                                    Previous
                                </Button>
                                <div className="hidden sm:flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={page === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPage(pageNum)}
                                                className={`h-9 w-9 p-0 rounded-xl text-xs font-bold transition-all ${
                                                    page === pageNum 
                                                        ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm' 
                                                        : 'border-gray-200 text-gray-600 hover:bg-white hover:text-violet-600'
                                                }`}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                    {totalPages > 5 && <span className="text-gray-300 mx-1">...</span>}
                                    {totalPages > 5 && page <= totalPages && (
                                        <Button
                                            variant={page === totalPages ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setPage(totalPages)}
                                            className={`h-9 w-9 p-0 rounded-xl text-xs font-bold transition-all ${
                                                page === totalPages 
                                                    ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm' 
                                                    : 'border-gray-200 text-gray-600 hover:bg-white hover:text-violet-600'
                                            }`}
                                        >
                                            {totalPages}
                                        </Button>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="rounded-xl h-9 px-4 border-gray-200 hover:bg-white hover:text-violet-600 transition-all text-xs font-bold"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Booking Detail Modal ── */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-lg">Booking Details</DialogTitle>
                        {selected && (
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                                #{selected.id.slice(0, 8).toUpperCase()} · {selected.status}
                            </p>
                        )}
                    </DialogHeader>

                    {selected && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                            {/* Column 1: Info */}
                            <div className="space-y-4">
                                {/* Passenger info */}
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Passenger</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <PiUser className="h-4 w-4 text-violet-500" />
                                        <span className="font-semibold text-gray-900">{selected.passengerName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <PiCreditCard className="h-4 w-4 text-violet-500" />
                                        <span className="text-gray-600 font-mono">{selected.passportNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <PiEnvelopeSimple className="h-4 w-4 text-violet-500" />
                                        <Input
                                            className="h-7 text-sm rounded-lg flex-1"
                                            value={accData.email}
                                            placeholder="passenger@email.com"
                                            onChange={e => setAccData({...accData, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <PiPhone className="h-4 w-4 text-violet-500" />
                                        <span className="text-gray-600">{selected.phone || "No PiPhone"}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 pt-2 border-t border-gray-100 text-[11px]">
                                        <div>
                                            <span className="text-gray-400 font-bold uppercase mr-1">Gender:</span>
                                            <span className="font-semibold text-gray-700">{selected.gender || "N/A"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 font-bold uppercase mr-1">Nat:</span>
                                            <span className="font-semibold text-gray-700">{selected.nationality || "N/A"}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-400 font-bold uppercase mr-1">DOB:</span>
                                            <span className="font-semibold text-gray-700">
                                                {selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString() : "N/A"}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-400 font-bold uppercase mr-1">PP Exp:</span>
                                            <span className="font-semibold text-gray-700">
                                                {selected.passportExpiry ? new Date(selected.passportExpiry).toLocaleDateString() : "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                    {(selected.agentDetails || selected.user?.name) && (
                                        <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t border-gray-200">
                                            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-200">
                                                Agent: {selected.agentDetails || selected.user?.name || 'Unknown'}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Flight info */}
                                {selected.route && (
                                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Flight</p>
                                        <div className="flex items-center gap-2 text-sm">
                                            <PiAirplaneTilt className="h-4 w-4 text-violet-600" />
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
                                            <span className="font-semibold text-gray-800">
                                                {selected.travelDate 
                                                    ? new Date(selected.travelDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                                                    : new Date(selected.route.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Update status */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Booking Status</Label>
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

                                <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Upload Ticket & Send Email</Label>
                                    <div className="flex flex-col gap-3">
                                        <Input
                                            type="file"
                                            accept="application/pdf"
                                            className="bg-white text-xs h-9 py-1"
                                            onChange={(e) => setTicketFile(e.target.files?.[0] || null)}
                                        />
                                        <Button
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold w-full h-9 rounded-xl"
                                            disabled={!ticketFile || sendTicketMutation.isPending}
                                            onClick={() => {
                                                if (ticketFile && selected) {
                                                    sendTicketMutation.mutate({ id: selected.id, file: ticketFile });
                                                }
                                            }}
                                        >
                                            <PiTicket className="w-4 h-4 mr-1.5" />
                                            {sendTicketMutation.isPending ? "Sending..." : "Send Ticket"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Accounting & Payment */}
                            <div className="space-y-4">
                                {/* Accounting & Fares */}
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <PiTicket className="h-4 w-4 text-emerald-600" />
                                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Accounting</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Purchase</Label>
                                            <Input 
                                                type="number" 
                                                className="h-8 rounded-lg text-sm"
                                                value={accData.purchasePrice}
                                                onChange={e => setAccData({...accData, purchasePrice: parseFloat(e.target.value) || 0})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Selling Price</Label>
                                            <Input 
                                                type="number" 
                                                className="h-8 rounded-lg text-sm font-bold text-violet-700"
                                                value={accData.sellingPrice}
                                                onChange={e => setAccData({...accData, sellingPrice: parseFloat(e.target.value) || 0})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">PNR</Label>
                                            <Input 
                                                className="h-8 rounded-lg text-sm font-mono uppercase"
                                                placeholder="PNR"
                                                value={pnrInput}
                                                onChange={e => setPnrInput(e.target.value.toUpperCase())}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Profit</Label>
                                            <div className={`h-8 flex items-center px-3 rounded-lg text-[11px] font-black border ${ (accData.sellingPrice - accData.purchasePrice) >= 0 ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-red-100 border-red-200 text-red-700'}`}>
                                                SAR {(accData.sellingPrice - accData.purchasePrice).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Base Fare</Label>
                                            <Input 
                                                type="number" 
                                                className="h-8 rounded-lg text-sm"
                                                value={accData.baseFare}
                                                onChange={e => setAccData({...accData, baseFare: parseFloat(e.target.value) || 0})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Tax & Service Fee</Label>
                                            <div className="flex gap-1">
                                                <Input 
                                                    type="number" 
                                                    className="h-8 rounded-lg text-sm flex-1"
                                                    placeholder="Tax"
                                                    value={accData.taxes}
                                                    onChange={e => setAccData({...accData, taxes: parseFloat(e.target.value) || 0})}
                                                />
                                                <Input 
                                                    type="number" 
                                                    className="h-8 rounded-lg text-sm flex-1"
                                                    placeholder="Fee"
                                                    value={accData.serviceFee}
                                                    onChange={e => setAccData({...accData, serviceFee: parseFloat(e.target.value) || 0})}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Ticket Number</Label>
                                            <Input 
                                                className="h-8 rounded-lg text-sm font-mono"
                                                placeholder="Tkt No"
                                                value={accData.ticketNumber}
                                                onChange={e => setAccData({...accData, ticketNumber: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Payment Status</Label>
                                            <Select
                                                defaultValue={accData.paymentStatus}
                                                onValueChange={v => setAccData({...accData, paymentStatus: v})}
                                            >
                                                <SelectTrigger className={`h-8 rounded-lg text-xs font-bold border ${accData.paymentStatus === 'PAID' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UNPAID">UNPAID (Adds to Pending Dues)</SelectItem>
                                                    <SelectItem value="PAID">PAID</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-emerald-200">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Airline</Label>
                                            <Input className="h-8 rounded-lg text-sm" value={accData.airline} onChange={e => setAccData({...accData, airline: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Sector</Label>
                                            <Input className="h-8 rounded-lg text-sm" value={accData.sector} onChange={e => setAccData({...accData, sector: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Travel Date</Label>
                                            <Input type="date" className="h-8 rounded-lg text-sm" value={accData.travelDate} onChange={e => setAccData({...accData, travelDate: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Given Name</Label>
                                            <Input className="h-8 rounded-lg text-sm" value={accData.givenName} onChange={e => setAccData({...accData, givenName: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Surname</Label>
                                            <Input className="h-8 rounded-lg text-sm" value={accData.surname} onChange={e => setAccData({...accData, surname: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Payment Method</Label>
                                            <Input className="h-8 rounded-lg text-sm" placeholder="Cash / Bank Transfer" value={accData.paymentMethod} onChange={e => setAccData({...accData, paymentMethod: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Remarks</Label>
                                            <Input className="h-8 rounded-lg text-sm" value={accData.remarks} onChange={e => setAccData({...accData, remarks: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Supplier</Label>
                                            <Input className="h-8 rounded-lg text-sm" value={accData.supplier} onChange={e => setAccData({...accData, supplier: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Request</Label>
                                            <Input className="h-8 rounded-lg text-sm" value={accData.request} onChange={e => setAccData({...accData, request: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase">Agent Name</Label>
                                            <Input className="h-8 rounded-lg text-sm" placeholder="Assign or edit agent name" value={accData.agentDetails} onChange={e => setAccData({...accData, agentDetails: e.target.value})} />
                                        </div>
                                    </div>

                                    <Button 
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-9 mt-4"
                                        disabled={updateMutation.isPending}
                                        onClick={() => {
                                            updateMutation.mutate({
                                                id: selected.id,
                                                data: { ...accData, pnr: pnrInput, travelDate: accData.travelDate ? new Date(accData.travelDate).toISOString() : undefined }
                                            });
                                        }}
                                    >
                                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>

                                {/* Payment Info */}
                                {selected.transactionId && (
                                    <div className="bg-amber-50 rounded-xl p-4 space-y-3">
                                        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Payment</p>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-amber-700 font-medium">TxID</span>
                                            <span className="font-mono font-bold text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">
                                                {selected.transactionId}
                                            </span>
                                        </div>
                                        {selected.paymentReceipt && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-amber-700 font-medium">Receipt</span>
                                                    <a
                                                        href={selected.paymentReceipt}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-violet-600 font-semibold hover:underline"
                                                    >
                                                        Open ↗
                                                    </a>
                                                </div>
                                                <img
                                                    src={selected.paymentReceipt}
                                                    alt="Payment receipt"
                                                    className="w-full rounded-lg border border-amber-200 object-contain max-h-40 bg-white shadow-sm"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button 
                            variant="outline" 
                            className="rounded-xl" 
                            onClick={() => setShowDetail(false)}
                        >
                            Close
                        </Button>
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6"
                            disabled={updateMutation.isPending}
                            onClick={() => {
                                if (selected) {
                                    updateMutation.mutate({ 
                                        id: selected.id, 
                                        data: accData 
                                    });
                                }
                            }}
                        >
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Modal ── */}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <PiWarning className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="font-black text-xl">Delete Booking?</DialogTitle>
                        <p className="text-gray-500 text-sm py-2">
                            This will permanently remove the booking record from the database. This action cannot be undone.
                        </p>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl"
                            onClick={() => setShowDelete(false)}
                            disabled={deleteMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                            onClick={() => deletingId && deleteMutation.mutate(deletingId)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete Now"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* ── Bulk Delete Confirmation Modal ── */}
            <Dialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <PiWarning className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="font-black text-xl">Delete {selectedIds.length} Bookings?</DialogTitle>
                        <p className="text-gray-500 text-sm py-2">
                            This will permanently remove the selected {selectedIds.length} booking(s) from the database. This action cannot be undone.
                        </p>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl"
                            onClick={() => setShowBulkDelete(false)}
                            disabled={bulkDeleteMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                            onClick={() => bulkDeleteMutation.mutate(selectedIds)}
                            disabled={bulkDeleteMutation.isPending}
                        >
                            {bulkDeleteMutation.isPending ? "Deleting..." : "Delete All"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* ── Add Manual Booking Modal ── */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-xl">Add Manual Booking</DialogTitle>
                        <p className="text-gray-500 text-sm">Create a new booking record for a customer manually.</p>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* Passenger Details */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Customer Info</h3>
                            
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Select Route / Sector</Label>
                                <Select onValueChange={v => {
                                    const r = routes.find((route: any) => route.id === v);
                                    setAddData({...addData, routeId: v, sellingPrice: r?.price || 0});
                                }}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Chose a flight route" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {routes.map((r: any) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.origin} → {r.destination} ({r.airline})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Passenger Name</Label>
                                <Input 
                                    placeholder="Full name as per passport"
                                    className="rounded-xl"
                                    value={addData.passengerName}
                                    onChange={e => setAddData({...addData, passengerName: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Passport Number</Label>
                                    <Input 
                                        placeholder="P1234567"
                                        className="rounded-xl font-mono uppercase"
                                        value={addData.passportNumber}
                                        onChange={e => setAddData({...addData, passportNumber: e.target.value.toUpperCase()})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Phone</Label>
                                    <Input 
                                        placeholder="+966..."
                                        className="rounded-xl"
                                        value={addData.phone}
                                        onChange={e => setAddData({...addData, phone: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Email Address</Label>
                                <Input 
                                    type="email"
                                    placeholder="customer@example.com"
                                    className="rounded-xl"
                                    value={addData.email}
                                    onChange={e => setAddData({...addData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Accounting Details */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Accounting & Fare</h3>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-emerald-700">Purchase Price</Label>
                                    <Input 
                                        type="number"
                                        placeholder="0.00"
                                        className="rounded-xl border-emerald-200"
                                        value={addData.purchasePrice}
                                        onChange={e => setAddData({...addData, purchasePrice: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-violet-700">Selling Price</Label>
                                    <Input 
                                        type="number"
                                        placeholder="0.00"
                                        className="rounded-xl border-violet-200"
                                        value={addData.sellingPrice}
                                        onChange={e => setAddData({...addData, sellingPrice: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Base Fare</Label>
                                    <Input 
                                        type="number"
                                        placeholder="0.00"
                                        className="rounded-xl"
                                        value={addData.baseFare}
                                        onChange={e => setAddData({...addData, baseFare: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Taxes</Label>
                                    <Input 
                                        type="number"
                                        placeholder="0.00"
                                        className="rounded-xl"
                                        value={addData.taxes}
                                        onChange={e => setAddData({...addData, taxes: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-sm font-semibold">Service Fee</Label>
                                    <Input 
                                        type="number"
                                        placeholder="0.00"
                                        className="rounded-xl"
                                        value={addData.serviceFee}
                                        onChange={e => setAddData({...addData, serviceFee: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">PNR / PiStar</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="PNR (ABCDEF)"
                                        className="rounded-xl font-mono uppercase w-1/2"
                                        value={addData.pnr}
                                        onChange={e => setAddData({...addData, pnr: e.target.value.toUpperCase()})}
                                    />
                                    <Input 
                                        placeholder="PiStar No"
                                        className="rounded-xl font-mono w-1/2"
                                        value={addData.ticketNumber}
                                        onChange={e => setAddData({...addData, ticketNumber: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Estimated Profit</p>
                                    <p className="text-lg font-black text-emerald-700">
                                        SAR {(addData.sellingPrice - addData.purchasePrice).toLocaleString()}
                                    </p>
                                </div>
                                <PiTicket className="h-8 w-8 text-emerald-200" />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>Cancel</Button>
                        <Button 
                            className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl px-8"
                            disabled={createMutation.isPending || !addData.routeId || !addData.passengerName}
                            onClick={() => createMutation.mutate(addData)}
                        >
                            {createMutation.isPending ? "Creating..." : "Create Booking"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* ── Booking Receipt Modal ── */}
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden rounded-2xl border-none">
                    <div className="h-full w-full overflow-hidden">
                        <BookingReceipt 
                            booking={selected} 
                            onClose={() => setShowReceipt(false)} 
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Bulk Import Modal ── */}
            <Dialog open={showBulkImport} onOpenChange={(open) => {
                setShowBulkImport(open);
                if (!open) {
                    setImportFile(null);
                    setImportResults(null);
                }
            }}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-xl">Bulk Import Bookings</DialogTitle>
                        <p className="text-gray-500 text-sm">Upload an Excel file (.xlsx) to bulk import booking data.</p>
                    </DialogHeader>

                    {!importResults ? (
                        <div className="space-y-4 py-4">
                            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-xs space-y-2">
                                <p className="font-bold text-violet-700 uppercase tracking-wider">Required Excel Columns:</p>
                                <ul className="list-disc list-inside text-violet-600 space-y-1">
                                    <li><strong>PREFIX / GIVEN NAME / SURNAME</strong> — Passenger Name</li>
                                    <li><strong>PASSPORT</strong> — Passport Number</li>
                                    <li><strong>PNR</strong> — Reservation Code</li>
                                    <li><strong>TRAVEL DATE</strong> — Flight Date</li>
                                    <li><strong>NET PRICE / SELLING PRICE</strong> — Pricing</li>
                                    <li><strong>AGENT</strong> — Agent Name (for Agent Dashboard)</li>
                                </ul>
                                <p className="text-violet-500 mt-1 italic">Optional: Gender, Nationality, D.O.B, Passport Expiry, Sector, Airline, Remarks</p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="import-file" className="text-sm font-semibold">Select Excel File</Label>
                                <Input 
                                    id="import-file"
                                    type="file" 
                                    accept=".xlsx, .xls, .csv"
                                    className="rounded-xl"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                />
                            </div>

                            <Button 
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10"
                                disabled={!importFile || bulkImportMutation.isPending}
                                onClick={() => importFile && bulkImportMutation.mutate(importFile)}
                            >
                                {bulkImportMutation.isPending ? "Importing Data..." : "Start Import"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className={`p-4 rounded-xl border ${importResults.failed === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                <p className="text-sm font-bold text-gray-900">Import Finished!</p>
                                <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                                    <div className="bg-white p-2 rounded-lg border border-emerald-200">
                                        <p className="text-emerald-600 font-bold uppercase">Success</p>
                                        <p className="text-lg font-black text-emerald-700">{importResults.success}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-red-200">
                                        <p className="text-red-600 font-bold uppercase">Failed</p>
                                        <p className="text-lg font-black text-red-700">{importResults.failed}</p>
                                    </div>
                                </div>
                            </div>

                            {importResults.errors.length > 0 && (
                                <div className="max-h-48 overflow-y-auto space-y-2 mt-4">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1">Import Failures ({importResults.failed})</p>
                                    {importResults.errors.map((err: any, idx: number) => (
                                        <div key={idx} className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-[11px] text-red-700 flex flex-col gap-0.5 shadow-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="font-black text-[10px] bg-red-100 px-1.5 py-0.5 rounded text-red-800 uppercase">Excel Row {err.row}</span>
                                                <span className="font-bold text-red-900">{err.identifier}</span>
                                            </div>
                                            <p className="opacity-80 italic mt-0.5 border-t border-red-200/50 pt-1">Error: {err.error}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button 
                                variant="outline" 
                                className="w-full rounded-xl"
                                onClick={() => {
                                    setShowBulkImport(false);
                                    setImportResults(null);
                                    setImportFile(null);
                                }}
                            >
                                Done
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Email Itinerary Modal ── */}
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <PiEnvelopeSimple className="h-6 w-6 text-blue-600" />
                        </div>
                        <DialogTitle className="font-black text-xl">Email Itinerary</DialogTitle>
                        <p className="text-gray-500 text-sm py-2">
                            Send the flight itinerary to the customer. You can change the email address below if needed.
                        </p>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Customer Email</Label>
                            <Input 
                                placeholder="customer@example.com"
                                className="rounded-xl border-gray-200"
                                value={emailInput}
                                onChange={e => setEmailInput(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl"
                            onClick={() => setShowEmailDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold"
                            onClick={() => selected && sendItineraryMutation.mutate({ id: selected.id, email: emailInput })}
                            disabled={sendItineraryMutation.isPending || !emailInput}
                        >
                            {sendItineraryMutation.isPending ? "Sending..." : "Send Now"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
