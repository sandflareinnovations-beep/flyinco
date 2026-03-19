"use client";

import { useQuery } from "@tanstack/react-query";
import { flyApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Plane, Users, DollarSign, Activity, TrendingUp } from "lucide-react";
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

    const seatData = sectorList.map((s: any) => ({
        name: `${s.originCode}→${s.destinationCode}`,
        Sold: (s.soldSeats || 0) + (s.heldSeats || 0),
        Remaining: s.remainingSeats || 0,
    }));

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
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Plane className="h-4 w-4 text-violet-600" />
                            Seat Occupancy per Route
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={seatData} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: '#f5f3ff' }} 
                                />
                                <Bar dataKey="Sold" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Remaining" fill="#ddd6fe" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
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
