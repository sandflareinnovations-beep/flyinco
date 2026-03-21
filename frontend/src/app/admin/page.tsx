"use client";

import { useQuery } from "@tanstack/react-query";
import { flyApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Plane, Users, DollarSign, Activity, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { LoadingLogo } from "@/components/ui/loading-logo";

const statCards = (totalRevenue: number, totalProfit: number, totalBookings: number, seatsSold: number, remainingSeats: number, totalUnpaidDues: number, topAgent: string) => [
    { label: "Total Revenue", value: `SAR ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", sub: "From selling prices" },
    { label: "Total Profit", value: `SAR ${totalProfit.toLocaleString()}`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50", sub: "Net margin" },
    { label: "Payments Due", value: `SAR ${totalUnpaidDues.toLocaleString()}`, icon: Activity, color: "text-red-600", bg: "bg-red-50", sub: "Total unpaid dues" },
    { label: "Top Performer", value: topAgent || "None", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Highest selling agent" },
    { label: "Seats Sold/Held", value: seatsSold, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Across all sectors" },
    { label: "Remaining", value: remainingSeats, icon: Plane, color: "text-amber-600", bg: "bg-amber-50", sub: "Available seats" },
];

export default function AdminDashboard() {
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
                <p className="text-gray-400 text-sm">Real-time Performance Metrics & Agent Activity</p>
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

            {/* Charts Row 1: Seats & Inventory */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30">
                        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center">
                                <Calendar className="h-3.5 w-3.5 text-violet-600" />
                            </div>
                            Travel Calendar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 h-[280px] overflow-y-auto w-full custom-scrollbar">
                        <div className="p-4 space-y-4">
                            {Object.entries(sectorList.reduce((acc: any, s: any) => {
                                const date = s.departureDate || 'Unscheduled';
                                if (!acc[date]) acc[date] = [];
                                acc[date].push(s);
                                return acc;
                            }, {})).sort((a: any, b: any) => {
                                if (a[0] === 'Unscheduled') return 1;
                                if (b[0] === 'Unscheduled') return -1;
                                return new Date(a[0]).getTime() - new Date(b[0]).getTime();
                            }).map(([date, flights]: any, i) => (
                                <div key={i} className="flex flex-col gap-2.5">
                                    <div className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 sticky top-0 bg-white/95 backdrop-blur py-1 z-10 border-b border-gray-100 pr-2">
                                        <Calendar className="h-3 w-3 text-violet-400" />
                                        {date !== 'Unscheduled' ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Unscheduled Fares'}
                                    </div>
                                    <div className="space-y-2">
                                        {flights.map((s: any, idx: number) => (
                                            <div key={idx} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-y-3 gap-x-4 bg-white p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-violet-200 hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100/50">
                                                        <Plane className="h-4 w-4 text-indigo-600 drop-shadow-sm" />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-gray-900 text-[15px] flex items-center gap-2 tracking-tight">
                                                            {s.originCode} <span className="text-gray-300 font-medium">→</span> {s.destinationCode}
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 font-semibold mt-0.5 flex items-center gap-1.5 opacity-80">
                                                            <span>{s.airline}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                            <span>{s.flightNumber}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-auto">
                                                    <span className="text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1.5 rounded uppercase">
                                                        {s.departureTime || "--:--"}
                                                    </span>
                                                    <span className="text-[10px] font-black tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded uppercase shadow-sm">
                                                        {s.remainingSeats} Left
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {sectorList.length === 0 && (
                                <div className="text-center text-sm font-medium text-gray-400 py-16 flex flex-col items-center justify-center gap-3 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <Calendar className="h-5 w-5 text-gray-300" />
                                    </div>
                                    <p>No scheduled flights available</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-600" />
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
                            <Users className="h-4 w-4 text-indigo-600" />
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
