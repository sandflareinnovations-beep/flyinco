"use client";
import { PiAirplaneTilt, PiUsers, PiPulse, PiCalendarBlank, PiCaretLeft, PiCaretRight, PiMegaphone, PiMoney, PiUserCircle, PiBookOpen, PiClock, PiReceipt } from "react-icons/pi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { flyApi, fetchWithCreds } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useState } from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InvoiceModal } from "@/components/admin/invoice-modal";

export default function StaffDashboard() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookingTab, setBookingTab] = useState<"recent" | "all" | "unpaid">("recent");
    const [bookingPage, setBookingPage] = useState(1);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceBooking, setInvoiceBooking] = useState<any>(null);
    const queryClient = useQueryClient();

    const updateTaskStatus = async (taskId: string, status: string) => {
        try {
            await fetchWithCreds(`/tasks/${taskId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            queryClient.invalidateQueries({ queryKey: ["staff-tasks"] });
        } catch (err) {
            console.error("Failed to update task status:", err);
        }
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const { data: metricsData, isLoading } = useQuery({
        queryKey: ["staff-metrics"],
        queryFn: () => flyApi.bookings.getMetrics(),
        staleTime: 60000,
        refetchInterval: 60000,
    });

    const { data: sectors } = useQuery({
        queryKey: ["sectors-all"],
        queryFn: () => flyApi.sectors.list({ limit: -1 }),
        staleTime: 60000,
    });

    const { data: announcements = [] } = useQuery({
        queryKey: ["announcements"],
        queryFn: () => fetchWithCreds("/announcements"),
        staleTime: 60000,
    });

    const { data: agentsData } = useQuery({
        queryKey: ["agents-list"],
        queryFn: () => flyApi.users.list({ limit: 1000 }),
        staleTime: 60000,
    });

    const { data: staffTasks = [] } = useQuery({
        queryKey: ["staff-tasks"],
        queryFn: () => fetchWithCreds("/tasks/my-tasks"),
        staleTime: 30000,
    });

    const { data: bookingsData } = useQuery({
        queryKey: ["staff-bookings-recent"],
        queryFn: () => flyApi.bookings.listPaginated({ page: 1, limit: 10 }),
        staleTime: 30000,
    });

    const { data: allBookingsData } = useQuery({
        queryKey: ["staff-bookings-all", bookingPage],
        queryFn: () => flyApi.bookings.listPaginated({ page: bookingPage, limit: 20 }),
        staleTime: 30000,
        enabled: bookingTab === "all",
    });

    const { data: unpaidBookingsData } = useQuery({
        queryKey: ["staff-bookings-unpaid", bookingPage],
        queryFn: () => flyApi.bookings.listPaginated({ page: bookingPage, limit: 20, paymentStatus: "UNPAID" }),
        staleTime: 30000,
        enabled: bookingTab === "unpaid",
    });

    const totalBookings = metricsData?.totalBookings ?? 0;
    const confirmedCount = metricsData?.confirmedCount ?? 0;
    const heldCount = metricsData?.heldCount ?? 0;
    const sectorList = Array.isArray(sectors) ? sectors : (sectors?.routes || []);
    const seatsSold = sectorList.reduce((sum: number, s: any) => sum + ((s.totalSeats || 0) - (s.remainingSeats || 0)), 0);
    const remainingSeats = sectorList.reduce((sum: number, s: any) => sum + (s.remainingSeats || 0), 0);

    const agentList = agentsData?.users?.filter((u: any) => u.role === "AGENT") || [];
    const totalAgents = agentList.length;
    const totalActiveBookings = bookingsData?.bookings?.filter((b: any) => b.status === "CONFIRMED" || b.status === "PENDING").length ?? 0;

    const statCards = [
        { label: "Total Bookings", value: totalBookings.toString(), icon: PiBookOpen, color: "text-violet-600", bg: "bg-violet-50", sub: "All bookings" },
        { label: "Confirmed", value: confirmedCount.toString(), icon: PiPulse, color: "text-emerald-600", bg: "bg-emerald-50", sub: "Confirmed bookings" },
        { label: "Held", value: heldCount.toString(), icon: PiCalendarBlank, color: "text-amber-600", bg: "bg-amber-50", sub: "Held bookings" },
        { label: "Active Agents", value: totalAgents.toString(), icon: PiUsers, color: "text-blue-600", bg: "bg-blue-50", sub: "Registered agents" },
        { label: "Seats Sold", value: seatsSold.toString(), icon: PiAirplaneTilt, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Across all sectors" },
    ];

    // Build calendar flight data
    const flightsByDate: Record<string, any[]> = {};
    sectorList.forEach((s: any) => {
        if (s.departureDate) {
            const key = format(new Date(s.departureDate), "yyyy-MM-dd");
            if (!flightsByDate[key]) flightsByDate[key] = [];
            flightsByDate[key].push(s);
        }
    });

    // Tasks by status
    const pendingTasks = staffTasks.filter((t: any) => t.status === "PENDING");
    const inProgressTasks = staffTasks.filter((t: any) => t.status === "IN_PROGRESS");
    const completedTasks = staffTasks.filter((t: any) => t.status === "COMPLETED");

    // Bookings for each tab
    const recentBookings = bookingsData?.bookings?.slice(0, 5) || [];
    const activeBookings = bookingTab === "all"
        ? (allBookingsData?.bookings || [])
        : bookingTab === "unpaid"
        ? (unpaidBookingsData?.bookings || [])
        : recentBookings;
    const activeTotal = bookingTab === "all"
        ? (allBookingsData?.total || 0)
        : bookingTab === "unpaid"
        ? (unpaidBookingsData?.total || 0)
        : recentBookings.length;
    const activeTotalPages = bookingTab === "recent" ? 1 : Math.ceil(activeTotal / 20);

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-7xl">
                <Skeleton className="h-10 w-64 rounded-xl" />
                <div className="grid grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                </div>
                <Skeleton className="h-[400px] rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900">Staff Dashboard</h1>
                <p className="text-gray-400 text-sm mt-0.5">Booking overview, agent management & tasks.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                                <card.icon className={`h-5 w-5 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                                <p className="text-lg font-black text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Tasks & Recent Bookings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Staff Tasks */}
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black text-gray-900 uppercase">My Tasks</CardTitle>
                            {staffTasks.length > 0 && (
                                <Badge variant="outline" className="text-violet-600 border-violet-200">
                                    {staffTasks.length} Total
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {pendingTasks.length === 0 && inProgressTasks.length === 0 && completedTasks.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No tasks assigned</p>
                            ) : (
                                <>
                                    {pendingTasks.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-amber-600 mb-2">PENDING ({pendingTasks.length})</p>
                                            {pendingTasks.slice(0, 5).map((task: any) => (
                                                <div key={task.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg mb-1">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <span className="text-sm font-medium">{task.title}</span>
                                                        {task.dueDate && <p className="text-[10px] text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                                                    </div>
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                                        className="text-xs font-bold rounded-lg border border-amber-200 bg-white text-amber-600 px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="COMPLETED">Completed</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {inProgressTasks.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-blue-600 mb-2">IN PROGRESS ({inProgressTasks.length})</p>
                                            {inProgressTasks.slice(0, 5).map((task: any) => (
                                                <div key={task.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg mb-1">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <span className="text-sm font-medium">{task.title}</span>
                                                        {task.dueDate && <p className="text-[10px] text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                                                    </div>
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                                        className="text-xs font-bold rounded-lg border border-blue-200 bg-white text-blue-600 px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="COMPLETED">Completed</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {completedTasks.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-emerald-600 mb-2">COMPLETED ({completedTasks.length})</p>
                                            {completedTasks.slice(0, 3).map((task: any) => (
                                                <div key={task.id} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg mb-1 opacity-75">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <span className="text-sm font-medium line-through text-gray-500">{task.title}</span>
                                                    </div>
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                                        className="text-xs font-bold rounded-lg border border-emerald-200 bg-white text-emerald-600 px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="COMPLETED">Completed</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bookings with Tabs: Recent / All / Unpaid */}
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black text-gray-900 uppercase">Bookings</CardTitle>
                            <div className="flex gap-1">
                                {(["recent", "all", "unpaid"] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => { setBookingTab(tab); setBookingPage(1); }}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                            bookingTab === tab
                                                ? "bg-violet-600 text-white"
                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        }`}
                                    >
                                        {tab === "recent" ? "Recent" : tab === "all" ? "All" : "Unpaid"}
                                        {tab === "unpaid" && unpaidBookingsData?.total ? (
                                            <span className="ml-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                {unpaidBookingsData.total}
                                            </span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {activeBookings.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No bookings found</p>
                            ) : (
                                <div className="space-y-2">
                                    {activeBookings.map((booking: any) => (
                                        <div
                                            key={booking.id}
                                            className={`flex items-center justify-between p-3 rounded-xl ${
                                                booking.paymentStatus !== "PAID" ? "bg-red-50/50 border border-red-100" : "bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900">{booking.passengerName}</p>
                                                <p className="text-xs text-gray-500">
                                                    {booking.route?.origin} → {booking.route?.destination}
                                                </p>
                                                {booking.agentDetails ? (
                                                    <p className="text-[10px] font-medium text-blue-600 mt-0.5">{booking.agentDetails}</p>
                                                ) : (
                                                    <p className="text-[10px] text-gray-400 mt-0.5">Direct</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <Badge variant="outline" className={`text-[10px] font-bold ${
                                                        booking.paymentStatus === "PAID"
                                                            ? "text-emerald-600 border-emerald-200"
                                                            : "text-red-600 border-red-200"
                                                    }`}>
                                                        {booking.paymentStatus || "UNPAID"}
                                                    </Badge>
                                                    <Badge variant="outline" className={`ml-1 text-[10px] font-bold ${
                                                        booking.status === "CONFIRMED" ? "text-emerald-600 border-emerald-200" :
                                                        booking.status === "HELD" ? "text-violet-600 border-violet-200" :
                                                        "text-amber-600 border-amber-200"
                                                    }`}>
                                                        {booking.status}
                                                    </Badge>
                                                </div>
                                                {booking.paymentStatus !== "PAID" && (
                                                    <button
                                                        onClick={() => { setInvoiceBooking(booking); setShowInvoiceModal(true); }}
                                                        className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-600 transition-colors"
                                                        title="Generate Receipt"
                                                    >
                                                        <PiReceipt className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Pagination for All/Unpaid tabs */}
                            {bookingTab !== "recent" && activeTotalPages > 1 && (
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl text-xs"
                                        disabled={bookingPage <= 1}
                                        onClick={() => setBookingPage(bookingPage - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-xs text-gray-400">
                                        Page {bookingPage} of {activeTotalPages} ({activeTotal} total)
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl text-xs"
                                        disabled={bookingPage >= activeTotalPages}
                                        onClick={() => setBookingPage(bookingPage + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Agents & Announcements */}
                <div className="space-y-6">
                    {/* Agent Management */}
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black text-gray-900 uppercase">Agent Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="text-center p-3 bg-emerald-50 rounded-xl">
                                    <p className="text-2xl font-black text-emerald-600">{totalAgents}</p>
                                    <p className="text-xs text-gray-500">Total Agents</p>
                                </div>
                                <div className="text-center p-3 bg-violet-50 rounded-xl">
                                    <p className="text-2xl font-black text-violet-600">{totalActiveBookings}</p>
                                    <p className="text-xs text-gray-500">Active Bookings</p>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {agentList.slice(0, 5).map((agent: any) => (
                                    <div key={agent.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <PiUserCircle className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">{agent.name}</p>
                                                <p className="text-[10px] text-gray-400">{agent.agencyName || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-600">Sales: SAR {(agent.totalSales || 0).toLocaleString()}</p>
                                            <p className="text-[10px] text-red-500">Dues: SAR {(agent.pendingDues || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Travel Calendar */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Travel Calendar</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-gray-100">
                                    <PiCaretLeft className="h-4 w-4 text-gray-500" />
                                </button>
                                <span className="text-sm font-bold text-gray-700 min-w-[120px] text-center">
                                    {format(currentMonth, "MMMM yyyy")}
                                </span>
                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-gray-100">
                                    <PiCaretRight className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {weekDays.map((d) => (
                                <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-2">
                                    {d}
                                </div>
                            ))}
                            {calendarDays.map((day) => {
                                const key = format(day, "yyyy-MM-dd");
                                const flights = flightsByDate[key] || [];
                                const inMonth = isSameMonth(day, currentMonth);
                                const today = isToday(day);
                                return (
                                    <div
                                        key={key}
                                        className={`min-h-[72px] rounded-xl p-1.5 text-xs border transition-colors ${
                                            today ? "border-violet-300 bg-violet-50/50" : inMonth ? "border-gray-100 bg-white" : "border-transparent bg-gray-50/50"
                                        }`}
                                    >
                                        <div className={`text-[10px] font-bold mb-1 ${inMonth ? "text-gray-700" : "text-gray-300"}`}>
                                            {format(day, "d")}
                                        </div>
                                        {flights.slice(0, 2).map((f: any, fi: number) => (
                                            <div key={fi} className="bg-violet-100 text-violet-800 rounded px-1 py-0.5 text-[9px] font-bold mb-0.5 truncate">
                                                {f.origin} {f.departureTime} ({f.remainingSeats})
                                            </div>
                                        ))}
                                        {flights.length > 2 && (
                                            <div className="text-[9px] text-gray-400 font-bold">+{flights.length - 2} more</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Announcements */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <PiMegaphone className="h-4 w-4 text-violet-600" />
                            Announcements
                        </h2>
                        <div className="space-y-3">
                            {(announcements as any[]).length === 0 ? (
                                <p className="text-sm text-gray-400">No announcements yet.</p>
                            ) : (
                                (announcements as any[]).slice(0, 5).map((a: any) => (
                                    <div key={a.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-800">{a.title}</p>
                                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                                        <p className="text-[10px] text-gray-300 mt-1.5">
                                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoice Modal */}
            {showInvoiceModal && invoiceBooking && (
                <InvoiceModal
                    onClose={() => { setShowInvoiceModal(false); setInvoiceBooking(null); }}
                    customerData={{
                        name: invoiceBooking.user?.name || invoiceBooking.agentDetails || invoiceBooking.passengerName,
                        email: invoiceBooking.email || invoiceBooking.user?.email || '',
                        phone: invoiceBooking.phone || invoiceBooking.user?.phone || '',
                    }}
                    initialItems={[{
                        description: `${invoiceBooking.passengerName} - ${invoiceBooking.route?.origin || '?'} → ${invoiceBooking.route?.destination || '?'} (${invoiceBooking.pnr || 'No PNR'})`,
                        quantity: 1,
                        unitPrice: invoiceBooking.sellingPrice || 0,
                        total: invoiceBooking.sellingPrice || 0,
                    }]}
                />
            )}
        </div>
    );
}
