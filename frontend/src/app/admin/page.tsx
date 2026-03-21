"use client";
import { PiAirplaneTilt, PiUsers, PiCurrencyDollar, PiPulse, PiTrendUp, PiCalendarBlank, PiCaretLeft, PiCaretRight } from "react-icons/pi";
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
    { label: "Total Revenue", value: `SAR ${totalRevenue.toLocaleString()}`, icon: PiCurrencyDollar, color: "text-emerald-600", bg: "bg-emerald-50", sub: "From selling prices" },
    { label: "Total Profit", value: `SAR ${totalProfit.toLocaleString()}`, icon: PiTrendUp, color: "text-violet-600", bg: "bg-violet-50", sub: "Net margin" },
    { label: "Payments Due", value: `SAR ${totalUnpaidDues.toLocaleString()}`, icon: PiPulse, color: "text-red-600", bg: "bg-red-50", sub: "Total unpaid dues" },
    { label: "Top Performer", value: topAgent || "None", icon: PiUsers, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Highest selling agent" },
    { label: "Seats Sold/Held", value: seatsSold, icon: PiPulse, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Across all sectors" },
    { label: "Remaining", value: remainingSeats, icon: PiAirplaneTilt, color: "text-amber-600", bg: "bg-amber-50", sub: "Available seats" },
];

export default function AdminDashboard() {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const { data: metricsData, isLoading: loadingMetrics } = useQuery({
        queryKey: ["admin-metrics"],
        queryFn: () => flyApi.bookings.getMetrics(),
        refetchInterval: 30000,
    });

    const { data: sectors, isLoading: loadingSectors } = useQuery({
        queryKey: ["sectors"],
        queryFn: () => flyApi.sectors.list(),
    });

    const isLoading = loadingMetrics;

    const totalRevenue = metricsData?.totalRevenue ?? 0;
    const totalProfit = metricsData?.totalProfit ?? 0;
    const totalBookings = metricsData?.totalBookings ?? 0;
    const totalUnpaidDues = metricsData?.totalUnpaidDues ?? 0;
    const agentPerformance = metricsData?.agentPerformance || [];
    const topAgent = agentPerformance.length > 0 ? agentPerformance[0].name : "None";


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
        } catch (e) {}
        return acc;
    }, {});

    const seatsSold = sectorList.reduce((acc: number, s: any) => acc + (s.soldSeats || 0) + (s.heldSeats || 0), 0);
    const remainingSeats = sectorList.reduce((acc: number, s: any) => acc + (s.remainingSeats || 0), 0);


    const agentSalesData = agentPerformance.map((a: any) => ({
        name: a.name.split(' ').slice(0, 1).join(' '), // Short name
        fullName: a.name,
        Sales: a.totalSales,
        Unpaid: a.unpaid,
    }));

    const pieData = [
        { name: "Sold", value: seatsSold },
        { name: "Remaining", value: remainingSeats }
    ];

    const PIE_COLORS = ['#7c3aed', '#ede9fe'];

    if (isLoading) return <LoadingLogo fullPage text="Updating Platform Stats..." />;

    return (
        <div className="space-y-8 max-w-6xl pb-10">
            <div>
                <h1 className="text-2xl font-black text-gray-900 mb-1">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Real-time Performance Metrics & Agent PiPulse</p>
            </div>

            {/* Stat Cards - 6 Columns on large screens */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {isLoading ? (
                    [...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
                ) : (
                    statCards(totalRevenue, totalProfit, totalBookings, seatsSold, remainingSeats, totalUnpaidDues, topAgent).map(({ label, value, icon: Icon, color, bg, sub }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                            <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                                        <Icon className={`h-4 w-4 ${color}`} />
                                    </div>
                                    <p className="text-lg font-black text-gray-900 truncate">{value}</p>
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
                                    {(seatsSold / (seatsSold + remainingSeats) * 100).toFixed(0)}% Sold
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
                                            {agent.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{agent.name}</p>
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
