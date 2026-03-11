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

const statCards = (totalRevenue: number, totalProfit: number, totalBookings: number, seatsSold: number, remainingSeats: number) => [
    { label: "Total Revenue", value: `SAR ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", sub: "From selling prices" },
    { label: "Total Profit", value: `SAR ${totalProfit.toLocaleString()}`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50", sub: "Net margin" },
    { label: "Seats Sold/Held", value: seatsSold, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Across all sectors" },
    { label: "Remaining Seats", value: remainingSeats, icon: Plane, color: "text-amber-600", bg: "bg-amber-50", sub: "Available to sell" },
];

export default function AdminDashboard() {
    const { data: bookings, isLoading: loadingBookings } = useQuery({
        queryKey: ["bookings"],
        queryFn: flyApi.bookings.list,
    });

    const { data: sectors, isLoading: loadingSectors } = useQuery({
        queryKey: ["sectors"],
        queryFn: flyApi.sectors.list,
    });

    const isLoading = loadingBookings || loadingSectors;

    const totalBookings = bookings?.length || 0;
    const activeBookings = bookings?.filter(b => b.status !== "CANCELLED") || [];
    const totalRevenue = activeBookings.reduce((acc, b) => acc + (b.sellingPrice || b.farePrice || 0), 0);
    const totalProfit = activeBookings.reduce((acc, b) => acc + (b.profit || 0), 0);
    const seatsSold = sectors?.reduce((acc, s) => acc + s.soldSeats + s.heldSeats, 0) || 0;
    const remainingSeats = sectors?.reduce((acc, s) => acc + s.remainingSeats, 0) || 0;

    const seatData = sectors?.map(s => ({
        name: `${s.originCode}→${s.destinationCode}`,
        Sold: s.soldSeats + s.heldSeats,
        Remaining: s.remainingSeats,
    })) || [];

    const pieData = [
        { name: "Sold", value: seatsSold },
        { name: "Remaining", value: remainingSeats }
    ];

    const PIE_COLORS = ['#7c3aed', '#ede9fe'];

    return (
        <div className="space-y-8 max-w-6xl">
            <div>
                <h1 className="text-2xl font-black text-gray-900 mb-1">Dashboard Overview</h1>
                <p className="text-gray-400 text-sm">Special Fare Platform Performance</p>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
                ) : (
                    statCards(totalRevenue, totalProfit, totalBookings, seatsSold, remainingSeats).map(({ label, value, icon: Icon, color, bg, sub }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                            <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                                            <Icon className={`h-5 w-5 ${color}`} />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{value}</p>
                                    <p className="text-sm font-semibold text-gray-600 mt-0.5">{label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <TrendingUp style={{ color: '#2E0A57' }} />
                            Seat Occupancy per Route
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                        {isLoading ? <Skeleton className="h-full w-full rounded-xl" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={seatData} barSize={24}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#f5f3ff' }} />
                                    <Bar dataKey="Sold" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Remaining" fill="#ede9fe" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Activity style={{ color: '#2E0A57' }} />
                            Inventory Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[260px] flex items-center justify-center">
                        {isLoading ? <Skeleton className="h-full w-full rounded-xl" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
