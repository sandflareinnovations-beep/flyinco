"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { flyApi } from "@/lib/api";
import * as XLSX from "xlsx";
import { PiChartBar, PiFileArrowDown, PiUsers, PiCurrencyDollar, PiTrendUp, PiMagnifyingGlass, PiCaretDown, PiCaretUp } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const formatCurrency = (v: number) => `SAR ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (d: string) => {
    if (!d) return "N/A";
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

export default function RouteReportsPage() {
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
    const [passengerData, setPassengerData] = useState<Record<string, any>>({});
    const [loadingPassengers, setLoadingPassengers] = useState<string | null>(null);

    const { data: routes = [], isLoading } = useQuery({
        queryKey: ["route-summary-report"],
        queryFn: () => flyApi.bookings.getRouteSummaryReport(),
    });

    const filtered = (routes as any[]).filter((r: any) => {
        const q = search.toLowerCase();
        return (
            !q ||
            r.origin?.toLowerCase().includes(q) ||
            r.destination?.toLowerCase().includes(q) ||
            r.airline?.toLowerCase().includes(q) ||
            r.flightNumber?.toLowerCase().includes(q) ||
            r.supplier?.toLowerCase().includes(q)
        );
    });

    const totals = filtered.reduce(
        (acc: any, r: any) => ({
            revenue: acc.revenue + (r.totalRevenue || 0),
            cost: acc.cost + (r.totalCost || 0),
            profit: acc.profit + (r.totalProfit || 0),
            bookings: acc.bookings + (r.totalBookings || 0),
        }),
        { revenue: 0, cost: 0, profit: 0, bookings: 0 }
    );

    const handleExportAll = () => {
        const rows = filtered.map((r: any) => ({
            "Route": `${r.origin} → ${r.destination}`,
            "Airline": r.airline,
            "Flight No": r.flightNumber,
            "Departure": formatDate(r.departureDate),
            "Supplier": r.supplier || "",
            "Total Seats": r.totalSeats,
            "Remaining": r.remainingSeats,
            "Sold": r.soldSeats,
            "Total Bookings": r.totalBookings,
            "Confirmed": r.confirmedBookings,
            "Held": r.heldBookings,
            "Total Revenue (SAR)": r.totalRevenue,
            "Total Cost (SAR)": r.totalCost,
            "Total Profit (SAR)": r.totalProfit,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Route Summary");
        XLSX.writeFile(wb, "Flyinco_Route_Report.xlsx");
        toast({ title: "Report Exported", description: `${filtered.length} routes exported.` });
    };

    const handleTogglePassengers = async (routeId: string) => {
        if (expandedRouteId === routeId) {
            setExpandedRouteId(null);
            return;
        }
        setExpandedRouteId(routeId);
        if (passengerData[routeId]) return;

        setLoadingPassengers(routeId);
        try {
            const report = await flyApi.bookings.getRoutePassengerReport(routeId);
            setPassengerData(prev => ({ ...prev, [routeId]: report }));
        } catch (e: any) {
            toast({ title: "Failed to load passengers", description: e.message, variant: "destructive" });
            setExpandedRouteId(null);
        } finally {
            setLoadingPassengers(null);
        }
    };

    const handleExportPassengers = async (routeId: string, route: any) => {
        let report = passengerData[routeId];
        if (!report) {
            try {
                report = await flyApi.bookings.getRoutePassengerReport(routeId);
            } catch (e: any) {
                toast({ title: "Export Failed", description: e.message, variant: "destructive" });
                return;
            }
        }
        const rows = report.passengers.map((p: any, i: number) => ({
            "SL NO": i + 1,
            "Passenger Name": p.passengerName,
            "Passport": p.passportNumber,
            "PNR": p.pnr || "",
            "Ticket No": p.ticketNumber || "",
            "Gender": p.gender || "",
            "Nationality": p.nationality || "",
            "Status": p.status,
            "Payment": p.paymentStatus,
            "Selling Price (SAR)": p.sellingPrice,
            "Purchase Price (SAR)": p.purchasePrice,
            "Profit (SAR)": p.profit,
            "Agent": p.agentDetails || "",
            "Phone": p.phone,
            "Email": p.email,
        }));
        rows.push({
            "SL NO": "", "Passenger Name": "TOTAL", "Passport": "",
            "PNR": `${report.summary.totalPassengers} pax`, "Ticket No": "",
            "Gender": "", "Nationality": "", "Status": `${report.summary.confirmedCount} confirmed`,
            "Payment": "", "Selling Price (SAR)": report.summary.totalRevenue,
            "Purchase Price (SAR)": report.summary.totalCost, "Profit (SAR)": report.summary.totalProfit,
            "Agent": "", "Phone": "", "Email": "",
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Passengers");
        XLSX.writeFile(wb, `${route.origin}-${route.destination}_${route.flightNumber}_Passengers.xlsx`);
        toast({ title: "Exported", description: `${report.summary.totalPassengers} passengers exported.` });
    };

    if (isLoading) return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-60 rounded-xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
    );

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Route Reports</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Flight-wise passenger list & financial breakdown.</p>
                </div>
                <Button
                    className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2 font-semibold"
                    onClick={handleExportAll}
                >
                    <PiFileArrowDown className="h-4 w-4" />
                    Export All Routes
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Total Revenue", value: formatCurrency(totals.revenue), icon: PiCurrencyDollar, color: "text-violet-600 bg-violet-50" },
                    { label: "Total Cost", value: formatCurrency(totals.cost), icon: PiTrendUp, color: "text-amber-600 bg-amber-50" },
                    { label: "Total Profit", value: formatCurrency(totals.profit), icon: PiChartBar, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Total Bookings", value: totals.bookings.toString(), icon: PiUsers, color: "text-blue-600 bg-blue-50" },
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${card.color}`}>
                            <card.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                            <p className="text-lg font-black text-gray-900">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Search route, airline, supplier..."
                    className="pl-9 rounded-xl border-gray-200 focus-visible:ring-violet-400 text-sm h-10"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 border-gray-100">
                            <TableHead className="font-bold text-xs text-gray-500">Route</TableHead>
                            <TableHead className="font-bold text-xs text-gray-500">Flight</TableHead>
                            <TableHead className="font-bold text-xs text-gray-500">Date</TableHead>
                            <TableHead className="font-bold text-xs text-gray-500">Supplier</TableHead>
                            <TableHead className="font-bold text-xs text-gray-500 text-center">Seats</TableHead>
                            <TableHead className="font-bold text-xs text-gray-500 text-right">Revenue</TableHead>
                            <TableHead className="font-bold text-xs text-gray-500 text-right">Cost</TableHead>
                            <TableHead className="font-bold text-xs text-gray-500 text-right">Profit</TableHead>
                            <TableHead className="font-bold text-xs text-gray-500 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-gray-400">
                                    No routes found.
                                </TableCell>
                            </TableRow>
                        ) : filtered.map((route: any) => (
                            <>
                                <motion.tr
                                    key={route.routeId}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="border-gray-100 hover:bg-gray-50/50 transition-colors"
                                >
                                    <TableCell>
                                        <div className="font-bold text-sm text-gray-900">{route.origin} → {route.destination}</div>
                                        <div className="text-xs text-gray-400">{route.originCity} → {route.destinationCity}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-semibold text-gray-800">{route.airline}</div>
                                        <div className="text-xs text-gray-400 font-mono">{route.flightNumber}</div>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">{formatDate(route.departureDate)}</TableCell>
                                    <TableCell>
                                        {route.supplier ? (
                                            <Badge variant="outline" className="text-xs font-medium border-violet-200 text-violet-700 bg-violet-50">{route.supplier}</Badge>
                                        ) : (
                                            <span className="text-xs text-gray-300">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="text-xs space-y-0.5">
                                            <div className="font-bold text-gray-700">{route.soldSeats}/{route.totalSeats}</div>
                                            <div className="text-gray-400">{route.totalBookings} bookings</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-sm text-gray-800">{formatCurrency(route.totalRevenue)}</TableCell>
                                    <TableCell className="text-right font-semibold text-sm text-amber-600">{formatCurrency(route.totalCost)}</TableCell>
                                    <TableCell className="text-right font-bold text-sm text-emerald-600">{formatCurrency(route.totalProfit)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-lg h-8 px-3 text-xs gap-1 border-gray-200"
                                                onClick={() => handleTogglePassengers(route.routeId)}
                                                disabled={loadingPassengers === route.routeId}
                                            >
                                                {loadingPassengers === route.routeId ? "Loading..." : (
                                                    <>
                                                        <PiUsers className="h-3 w-3" />
                                                        Passengers
                                                        {expandedRouteId === route.routeId ? <PiCaretUp className="h-3 w-3" /> : <PiCaretDown className="h-3 w-3" />}
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="rounded-lg h-8 px-2 text-violet-600 hover:bg-violet-50"
                                                onClick={() => handleExportPassengers(route.routeId, route)}
                                            >
                                                <PiFileArrowDown className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </motion.tr>

                                {/* Expandable Passenger List */}
                                <AnimatePresence>
                                    {expandedRouteId === route.routeId && passengerData[route.routeId] && (
                                        <tr key={`expand-${route.routeId}`}>
                                            <td colSpan={9} className="p-0">
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="bg-violet-50/40 border-t border-b border-violet-100 overflow-hidden"
                                                >
                                                    <div className="p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <p className="text-xs font-black text-violet-900 uppercase tracking-wider">Passenger List</p>
                                                                <Badge className="bg-violet-100 text-violet-700 border-none text-xs">
                                                                    {passengerData[route.routeId].summary.totalPassengers} pax
                                                                </Badge>
                                                                <Badge className="bg-emerald-100 text-emerald-700 border-none text-xs">
                                                                    {passengerData[route.routeId].summary.confirmedCount} confirmed
                                                                </Badge>
                                                                <Badge className="bg-amber-100 text-amber-700 border-none text-xs">
                                                                    {passengerData[route.routeId].summary.heldCount} held
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="rounded-xl overflow-hidden border border-violet-100 bg-white">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="bg-violet-50 border-b border-violet-100">
                                                                        <th className="text-left px-3 py-2 font-bold text-violet-800">#</th>
                                                                        <th className="text-left px-3 py-2 font-bold text-violet-800">Passenger</th>
                                                                        <th className="text-left px-3 py-2 font-bold text-violet-800">Passport</th>
                                                                        <th className="text-left px-3 py-2 font-bold text-violet-800">PNR</th>
                                                                        <th className="text-left px-3 py-2 font-bold text-violet-800">Status</th>
                                                                        <th className="text-left px-3 py-2 font-bold text-violet-800">Payment</th>
                                                                        <th className="text-right px-3 py-2 font-bold text-violet-800">Sale</th>
                                                                        <th className="text-right px-3 py-2 font-bold text-violet-800">Cost</th>
                                                                        <th className="text-right px-3 py-2 font-bold text-violet-800">Profit</th>
                                                                        <th className="text-left px-3 py-2 font-bold text-violet-800">Agent</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {passengerData[route.routeId].passengers.map((p: any) => (
                                                                        <tr key={p.id} className="border-b border-gray-50 hover:bg-violet-50/30">
                                                                            <td className="px-3 py-2 text-gray-400">{p.slNo}</td>
                                                                            <td className="px-3 py-2 font-semibold text-gray-800">{p.passengerName}</td>
                                                                            <td className="px-3 py-2 font-mono text-gray-500">{p.passportNumber}</td>
                                                                            <td className="px-3 py-2 font-mono text-violet-700 font-bold">{p.pnr || "—"}</td>
                                                                            <td className="px-3 py-2">
                                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : p.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                                                                    {p.status}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                                                    {p.paymentStatus}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-2 text-right font-semibold">{p.sellingPrice.toLocaleString()}</td>
                                                                            <td className="px-3 py-2 text-right text-amber-600">{p.purchasePrice.toLocaleString()}</td>
                                                                            <td className="px-3 py-2 text-right text-emerald-600 font-bold">{p.profit.toLocaleString()}</td>
                                                                            <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{p.agentDetails || "—"}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                                <tfoot>
                                                                    <tr className="bg-violet-50 border-t border-violet-200 font-bold">
                                                                        <td colSpan={6} className="px-3 py-2 text-violet-800">TOTAL ({passengerData[route.routeId].summary.totalPassengers} pax)</td>
                                                                        <td className="px-3 py-2 text-right text-violet-800">{passengerData[route.routeId].summary.totalRevenue.toLocaleString()}</td>
                                                                        <td className="px-3 py-2 text-right text-amber-700">{passengerData[route.routeId].summary.totalCost.toLocaleString()}</td>
                                                                        <td className="px-3 py-2 text-right text-emerald-700">{passengerData[route.routeId].summary.totalProfit.toLocaleString()}</td>
                                                                        <td />
                                                                    </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
