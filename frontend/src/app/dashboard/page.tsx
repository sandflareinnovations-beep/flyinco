"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { LogOut, Map, Calendar, Settings, Plane, FileText, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { flyApi, API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function UserDashboard() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function fetchMyBookings() {
            try {
                const data = await flyApi.bookings.list();
                setBookings(data);
            } catch (error: any) {
                if (error.message.includes("Unauthorized") || error.message.includes("401")) {
                    router.push("/login");
                }
                toast({
                    title: "Error fetching bookings",
                    description: error.message,
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchMyBookings();
    }, [toast, router]);

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });
            localStorage.removeItem("user");
            router.push("/login");
        } catch {
            router.push("/login");
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse mt-20">Loading your profile...</div>;
    }

    const userName = (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}")?.name : "Passenger") || "Passenger";

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl pt-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Welcome Back, {userName}</h1>
                    <p className="text-muted-foreground max-w-xl text-lg">Manage your secured flights, check itinerary statuses, and explore upcoming trips below.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 font-medium" onClick={() => router.push("/")}>
                        <Plane className="h-4 w-4" />
                        Book Fares
                    </Button>
                    <Button variant="destructive" className="gap-2 font-medium" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Log out
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-3 shadow-lg border-2 border-primary/10">
                    <CardHeader className="bg-muted/30 pb-4 border-b">
                        <CardTitle className="text-xl flex items-center gap-2 font-bold text-primary">
                            <FileText className="h-6 w-6" />
                            My Secured Bookings
                        </CardTitle>
                        <CardDescription className="text-sm">
                            You have successfully processed {bookings.length} booking(s).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {bookings.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <Map className="h-16 w-16 text-muted mb-4" />
                                <h3 className="text-xl font-bold tracking-tight mb-2">No flights booked yet</h3>
                                <p className="text-muted-foreground mb-6">You haven&apos;t made any reservations on Flyinco yet.</p>
                                <Button onClick={() => router.push('/')} size="lg">Explore Special Fares</Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-transparent border-b">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[120px] font-semibold">Booking ID</TableHead>
                                        <TableHead className="font-semibold">Route Sectors</TableHead>
                                        <TableHead className="font-semibold">Passenger</TableHead>
                                        <TableHead className="font-semibold">Price</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="text-right font-semibold">Booking Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookings.map((booking) => (
                                        <TableRow key={booking.id} className="group hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {booking.id.substring(0, 8)}
                                            </TableCell>
                                            <TableCell className="font-bold">
                                                <div className="flex items-center gap-2">
                                                    <Map className="h-4 w-4 text-primary" />
                                                    {booking.route}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-muted-foreground">
                                                {booking.passengerName}
                                            </TableCell>
                                            <TableCell className="font-bold text-primary">
                                                ₹{booking.farePrice?.toLocaleString() || "0"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        booking.status === "CONFIRMED" ? "default" :
                                                            booking.status === "HELD" ? "secondary" : "destructive"
                                                    }
                                                    className={booking.status === "CONFIRMED" ? "bg-emerald-500 hover:bg-emerald-600 font-semibold" : booking.status === "HELD" ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 font-semibold" : ""}
                                                >
                                                    {booking.status === "CONFIRMED" && <CheckCircle className="h-3 w-3 mr-1" />}
                                                    {booking.status === "HELD" && <Clock className="h-3 w-3 mr-1" />}
                                                    {booking.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground font-medium">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(booking.createdAt), "MMM dd, yyyy")}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
