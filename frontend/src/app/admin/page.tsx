"use client";
import { PiAirplaneTilt, PiUsers, PiWallet, PiPulse, PiTrendUp, PiCalendarBlank, PiCaretLeft, PiCaretRight, PiMoney, PiEye, PiEyeClosed } from "react-icons/pi";
import { useQuery } from "@tanstack/react-query";
import { flyApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

import { motion } from "framer-motion";
import { useState } from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { LoadingLogo } from "@/components/ui/loading-logo";

const statCards = (totalRevenue: number, totalProfit: number, totalBookings: number, seatsSold: number, remainingSeats: number, totalUnpaidDues: number, topAgent: string) => [
    { label: "Total Revenue", value: `SAR ${totalRevenue.toLocaleString()}`, icon: PiMoney, color: "text-emerald-600", bg: "bg-emerald-50", sub: "From selling prices", sensitive: false },
    { label: "Total Profit", value: `SAR ${totalProfit.toLocaleString()}`, icon: PiTrendUp, color: "text-violet-600", bg: "bg-violet-50", sub: "Net margin", sensitive: true },
    { label: "Payments Due", value: `SAR ${totalUnpaidDues.toLocaleString()}`, icon: PiPulse, color: "text-red-600", bg: "bg-red-50", sub: "Total unpaid dues", sensitive: false },
    { label: "Top Performer", value: topAgent || "None", icon: PiUsers, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Highest selling agent", sensitive: false },
    { label: "Seats Sold/Held", value: seatsSold, icon: PiPulse, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Across all sectors", sensitive: false },
    { label: "Remaining", value: remainingSeats, icon: PiAirplaneTilt, color: "text-amber-600", bg: "bg-amber-50", sub: "Available seats", sensitive: false },
];

export default function AdminDashboard() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showProfit, setShowProfit] = useState(false);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const { data: metricsData, isLoading: loadingMetrics, isError, error } = useQuery({
        queryKey: ["admin-metrics"],
        queryFn: () => flyApi.bookings.getMetrics(),
        staleTime: 60000, // Cache for 1 minute — prevents refetch on tab switch
        refetchInterval: 60000, // Poll every 60s instead of 30s
    });

    const { data: sectors, isLoading: loadingSectors } = useQuery({
        queryKey: ["sectors"],
        queryFn: () => flyApi.sectors.list({ limit: -1 }),
        staleTime: 60000, // Cache sectors for 1 minute
    });

    const isLoading = loadingMetrics;

    const totalRevenue = metricsData?.totalRevenue ?? 0;
    const totalProfit = metricsData?.totalProfit ?? 0;
    const totalBookings = metricsData?.totalBookings ?? 0;
    const totalUnpaidDues = metricsData?.totalUnpaidDues ?? 0;
    const agentPerformance = metricsData?.agentPerformance || [];
    const validAgents = agentPerformance.filter((a: any) => a.name !== 'Direct');
    const topAgent = validAgents.length > 0 ? validAgents[0].name : "None";


    const sectorList = Array.isArray(sectors) ? sectors : (sectors?.routes || []);
    
    // Group flights by day for calendar
    const flightsByDate = sectorList.reduce((acc: any, s: any) => {
        if (!s.departureDate) return acc;
        try {
            const d = new Date(s.departureDate);
            if (!isNaN(d.getTime())) {
                const key = format(d, 'yyyy-MM-dd');
                if (!acc[key]) acc[key] = [];
                acc[key].push(s);
            }
        } catch (e) { console.warn('Invalid departure date:', s.departureDate, e); }
        return acc;
    }, {});

    const seatsSold = sectorList.reduce((acc: number, s: any) => acc + (s.soldSeats || 0) + (s.heldSeats || 0), 0);
    const remainingSeats = sectorList.reduce((acc: number, s: any) => acc + (s.remainingSeats || 0), 0);


    const agentSalesData = agentPerformance.map((a: any) => {
        const displayName = a.name || 'Unknown';
        return {
        name: displayName.length > 12 ? displayName.split(' ').slice(0, 1).join(' ') : displayName,
        fullName: displayName,
        Sales: a.totalSales,
        Unpaid: a.unpaid,
    };
    });

    const pieData = [
        { name: "Sold", value: seatsSold },
        { name: "Remaining", value: remainingSeats }
    ];

    const PIE_COLORS = ['#7c3aed', '#ede9fe'];

    if (isLoading) return <LoadingLogo fullPage text="Updating Platform Stats..." />;
    if (isError) return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-red-600 font-bold">Failed to load dashboard metrics</p>
            <p className="text-sm text-gray-500 mt-1">{(error as any)?.message || 'Unknown error'}</p>
        </div>
    );

    return (
        <div className="space-y-8 max-w-6xl pb-10">
            <div>
                <h1 className="text-2xl font-black text-gray-900 mb-1">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Real-time Performance Metrics & Agent Activity</p>
            </div>

            {/* Stat Cards - 6 Columns on large screens */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {isLoading ? (
                    [...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
                ) : (
                    statCards(totalRevenue, totalProfit, totalBookings, seatsSold, remainingSeats, totalUnpaidDues, topAgent).map(({ label, value, icon: Icon, color, bg, sub, sensitive }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                            <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                                            <Icon className={`h-4 w-4 ${color}`} />
                                        </div>
                                        {sensitive && (
                                            <button
                                                onClick={() => setShowProfit(!showProfit)}
                                                className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                                                title={showProfit ? "Hide profit" : "Show profit"}
                                            >
                                                {showProfit ? <PiEye className="h-3.5 w-3.5 text-gray-500" /> : <PiEyeClosed className="h-3.5 w-3.5 text-gray-400" />}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-lg font-black text-gray-900 truncate">
                                        {sensitive && !showProfit ? "•••••••" : value}
                                    </p>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Charts Row 1: Flights Calendar & Inventory */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-gray-100 shadow-sm overflow-hidden flex flex-col md:col-span-2 h-full">
                    <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center">
                                    <PiCalendarBlank className="h-4 w-4 text-violet-600" />
                                </div>
                                Travel Calendar
                            </CardTitle>
                            <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-100 shadow-sm">
                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><PiCaretLeft className="h-4 w-4 text-gray-500" /></button>
                                <span className="text-xs font-black w-24 text-center text-gray-800 uppercase tracking-widest">{format(currentMonth, 'MMM yyyy')}</span>
                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><PiCaretRight className="h-4 w-4 text-gray-500" /></button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-3 custom-scrollbar">
                        <div className="h-full">
                            <div className="grid grid-cols-7 gap-1.5 mb-2">
                                {weekDays.map(day => (
                                    <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{day.substring(0, 3)}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1.5 min-h-[260px]">
                                {calendarDays.map((day, i) => {
                                    const dayKey = format(day, 'yyyy-MM-dd');
                                    const dayFlights = flightsByDate[dayKey] || [];
                                    const isCurrentMonth = isSameMonth(day, currentMonth);
                                    const isTodayDate = isToday(day);

                                    return (
                                        <div key={i} className={`flex flex-col min-h-[50px] p-1.5 rounded-lg border transition-all ${isCurrentMonth ? 'bg-white border-gray-100 hover:border-violet-200 hover:shadow-sm' : 'bg-gray-50/40 border-transparent opacity-50'} ${isTodayDate ? 'ring-2 ring-violet-500 ring-offset-1 border-transparent shadow-sm' : ''}`}>
                                            <div className={`text-[10px] font-black leading-none mb-1.5 ${isTodayDate ? 'text-violet-600' : 'text-gray-700'}`}>
                                                {format(day, 'd')}
                                            </div>
                                            <div className="space-y-1">
                                                {dayFlights.slice(0, 3).map((f: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between text-[8px] leading-[10px] bg-indigo-50/80 text-indigo-800 px-1 py-0.5 rounded font-black border border-indigo-100/50" title={`${f.originCode}→${f.destinationCode} | ${f.remainingSeats} Seats Left`}>
                                                        <span>{f.originCode}</span>
                                                        <span className="text-[7px] text-indigo-500 font-bold ml-0.5">{f.departureTime || "--:--"}</span>
                                                    </div>
                                                ))}
                                                {dayFlights.length > 3 && (
                                                    <div className="text-[8px] text-center bg-gray-50 text-gray-500 font-bold px-1 py-0.5 rounded border border-gray-100">+{dayFlights.length - 3} more</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <PiPulse className="h-4 w-4 text-emerald-600" />
                            Global Inventory Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="font-bold text-gray-400 text-xs">
                                    {seatsSold + remainingSeats > 0 ? (seatsSold / (seatsSold + remainingSeats) * 100).toFixed(0) : 0}% Sold
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2: Agent Performance */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <PiUsers className="h-4 w-4 text-indigo-600" />
                            Sales by Agent (SAR)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={agentSalesData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                <XAxis type="number" fontSize={10} hide />
                                <YAxis dataKey="name" type="category" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="Sales" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="Unpaid" fill="#f87171" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="md:col-span-1 border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-3">
                        <CardTitle className="text-sm font-bold text-gray-700">Top Performing Agents</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                            {agentPerformance.slice(0, 5).map((agent: any, i: number) => (
                                <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs uppercase">
                                            {(agent.name || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{agent.name || 'Unknown'}</p>
                                            <p className="text-[10px] text-gray-500">{agent.count} Bookings</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">SAR {agent.totalSales.toLocaleString()}</p>
                                        {agent.unpaid > 0 ? (
                                            <p className="text-[10px] text-red-500 font-bold">Due: {agent.unpaid.toLocaleString()}</p>
                                        ) : (
                                            <p className="text-[10px] text-emerald-500 font-bold">Paid</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
