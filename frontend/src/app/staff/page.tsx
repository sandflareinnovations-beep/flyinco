"use client";
import { PiAirplaneTilt, PiUsers, PiPulse, PiCalendarBlank, PiCaretLeft, PiCaretRight, PiMegaphone } from "react-icons/pi";
import { useQuery } from "@tanstack/react-query";
import { flyApi, fetchWithCreds } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useState } from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";

export default function StaffDashboard() {
    const [currentMonth, setCurrentMonth] = useState(new Date());

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

    const totalBookings = metricsData?.totalBookings ?? 0;
    const statusCounts = metricsData?.statusCounts ?? {};
    const sectorList = Array.isArray(sectors) ? sectors : (sectors?.routes || []);
    const seatsSold = sectorList.reduce((sum: number, s: any) => sum + ((s.totalSeats || 0) - (s.remainingSeats || 0)), 0);
    const remainingSeats = sectorList.reduce((sum: number, s: any) => sum + (s.remainingSeats || 0), 0);

    const statCards = [
        { label: "Total Bookings", value: totalBookings.toString(), icon: PiUsers, color: "text-violet-600", bg: "bg-violet-50", sub: "All bookings" },
        { label: "Confirmed", value: (statusCounts.CONFIRMED ?? 0).toString(), icon: PiPulse, color: "text-emerald-600", bg: "bg-emerald-50", sub: "Confirmed bookings" },
        { label: "Held", value: (statusCounts.HELD ?? 0).toString(), icon: PiCalendarBlank, color: "text-amber-600", bg: "bg-amber-50", sub: "Held bookings" },
        { label: "Seats Sold", value: seatsSold.toString(), icon: PiPulse, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Across all sectors" },
        { label: "Remaining", value: remainingSeats.toString(), icon: PiAirplaneTilt, color: "text-amber-600", bg: "bg-amber-50", sub: "Available seats" },
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
                <p className="text-gray-400 text-sm mt-0.5">Booking overview & flight schedule.</p>
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
                {/* Travel Calendar */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
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
    );
}
