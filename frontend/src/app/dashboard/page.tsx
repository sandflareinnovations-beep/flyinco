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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BookingReceipt } from "@/components/admin/booking-receipt";

export default function UserDashboard() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [sectors, setSectors] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const profile = await flyApi.auth.me();
                setUserProfile(profile);
                const data = await flyApi.bookings.list();
                setBookings(data);
                
                try {
                    const anns = await flyApi.announcements.list();
                    setAnnouncements(anns.filter((a: any) => a.active));
                } catch (e) {
                    // Ignore announcement errors
                }

                try {
                    const scs = await flyApi.sectors.list();
                    setSectors(scs.filter((s: any) => s.bookingStatus !== "CLOSED" && s.bookingStatus !== "SOLD" && s.remainingSeats > 0));
                } catch(e) {
                    // Ignore sector errors
                }

                if (profile?.role === 'AGENT') {
                    try {
                        const py = await flyApi.payments.byAgent(profile.id);
                        setPayments(py);
                    } catch(e) {}
                }
            } catch (error: any) {
                if (error.message?.includes("Unauthorized") || error.message?.includes("401")) {
                    router.push("/login");
                }
                toast({
                    title: "Error fetching data",
                    description: error.message,
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
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

            {userProfile?.role === 'AGENT' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                Total Sales
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">₹{userProfile.totalSales?.toLocaleString() || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                Unpaid Dues
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">₹{userProfile.pendingDues?.toLocaleString() || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                Total Paid
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">₹{userProfile.totalPaid?.toLocaleString() || 0}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {announcements.length > 0 && (
                    <Card className="col-span-1 md:col-span-3 shadow-sm border border-border">
                        <CardHeader className="bg-primary/5 pb-3">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Notifications & Announcements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {announcements.map((ann) => (
                                <div key={ann.id} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                                    <div className="flex justify-between mb-1">
                                        <h4 className="font-bold text-sm text-foreground">{ann.title}</h4>
                                        <Badge variant="outline" className="text-[10px]">{new Date(ann.createdAt).toLocaleDateString()}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ann.content}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {userProfile?.role === 'AGENT' && sectors.length > 0 && (
                    <Card className="col-span-1 md:col-span-3 shadow-md border-2 border-emerald-100 mb-6">
                        <CardHeader className="bg-emerald-50/50 pb-3 border-b border-emerald-100">
                            <CardTitle className="text-xl flex items-center gap-2 font-bold text-emerald-800">
                                <Plane className="h-6 w-6" />
                                Available Routes for Booking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-transparent border-b">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold">Airline</TableHead>
                                        <TableHead className="font-semibold">Route Sectors</TableHead>
                                        <TableHead className="font-semibold">Departure Date</TableHead>
                                        <TableHead className="font-semibold">Remaining Seats</TableHead>
                                        <TableHead className="font-semibold">Agent Price</TableHead>
                                        <TableHead className="text-right font-semibold">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sectors.map((s) => (
                                        <TableRow key={s.id} className="group hover:bg-emerald-50/30 transition-colors">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2 text-sm">
                                                    {s.airlineLogo ? (
                                                        <img src={s.airlineLogo} alt={s.airline} className="h-4 w-auto object-contain" />
                                                    ) : (
                                                        <Plane className="h-4 w-4 text-emerald-600" />
                                                    )}
                                                    {s.airline}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold">
                                                <div className="flex items-center gap-2 text-sm">
                                                    {s.originCode} <span className="text-emerald-300">→</span> {s.destinationCode}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {s.departureDate ? new Date(s.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none font-bold">
                                                    {s.remainingSeats} left
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-black text-emerald-700 text-base">
                                                ₹{s.price?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    size="sm" 
                                                    className="h-8 gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4"
                                                    onClick={() => router.push(`/routes/${s.id}/flights`)}
                                                >
                                                    <Plane className="h-3.5 w-3.5" />
                                                    Book Now
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {userProfile?.role === 'AGENT' && payments.length > 0 && (
                    <Card className="col-span-1 md:col-span-3 shadow-md border-2 border-indigo-100 mb-6">
                        <CardHeader className="bg-indigo-50/50 pb-3 border-b border-indigo-100">
                            <CardTitle className="text-xl flex items-center gap-2 font-bold text-indigo-800">
                                <FileText className="h-6 w-6" />
                                Payment & Remarks History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-transparent border-b">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold">Date</TableHead>
                                        <TableHead className="font-semibold">Amount</TableHead>
                                        <TableHead className="font-semibold">Type</TableHead>
                                        <TableHead className="font-semibold w-1/2">Remarks / Note</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((p) => (
                                        <TableRow key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                                            <TableCell className="text-sm">
                                                {format(new Date(p.createdAt), "MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell className="font-bold">
                                                <span className={p.type === 'PAYMENT' ? 'text-emerald-600' : 'text-amber-600'}>
                                                    ₹{p.amount?.toLocaleString() || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={p.type === 'PAYMENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                                                    {p.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {p.remarks || "No remarks"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

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
                                        <TableHead className="font-semibold">Sale Price</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="font-semibold">Booking Date</TableHead>
                                        <TableHead className="text-right font-semibold">Itinerary</TableHead>
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
                                                    {booking.route?.origin} → {booking.route?.destination}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-muted-foreground">
                                                {booking.passengerName}
                                            </TableCell>
                                            <TableCell className="font-bold text-primary">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span>₹{booking.sellingPrice?.toLocaleString() || "0"}</span>
                                                    <Badge variant="outline" className={`text-[9px] py-0 h-4 ${booking.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                                        {booking.paymentStatus || 'UNPAID'}
                                                    </Badge>
                                                </div>
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
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(booking.createdAt), "MMM dd, yyyy")}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-8 gap-1.5 rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setShowReceipt(true);
                                                    }}
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Receipt
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Booking Receipt Modal ── */}
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <BookingReceipt 
                        booking={selectedBooking} 
                        onClose={() => setShowReceipt(false)} 
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
