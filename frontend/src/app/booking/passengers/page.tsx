"use client";
import { PiArrowLeft, PiUser, PiSpinner, PiPhone, PiEnvelopeSimple, PiCreditCard, PiArrowRight, PiNote } from "react-icons/pi";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mockFlights } from "@/lib/mock";
import { FlightOption, PassengerCounts, PassengerDetail } from "@/lib/types";
import { BookingSummaryCard } from "@/components/booking/booking-summary-card";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { API_BASE } from "@/lib/api";

function PassengersForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const flightId = searchParams.get('flightId') || '';
    const routeId = searchParams.get('routeId') || '';

    const [flight, setFlight] = useState<FlightOption | null>(null);
    const [passengerCounts] = useState<PassengerCounts>({ adults: 1, children: 0, infants: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Contact info
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [isStaff, setIsStaff] = useState(false);
    const [remarks, setRemarks] = useState('');

    // Passenger details
    const [passenger, setPassenger] = useState<Partial<PassengerDetail>>({
        title: 'Mr',
        type: 'ADULT',
    });

    useEffect(() => {
        const storedFlight = sessionStorage.getItem('selectedFlight');
        if (storedFlight) {
            setFlight(JSON.parse(storedFlight));
        } else {
            const f = mockFlights.find(f => f.id === flightId);
            if (f) setFlight(f);
        }

        // Detect staff user
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setIsStaff(user?.role === 'STAFF');
            } catch {}
        }
    }, [flightId]);

    const updatePassenger = (key: keyof PassengerDetail, value: string) => {
        setPassenger(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone || !email) {
            toast({ title: "Missing Fields", description: "Phone and email are required.", variant: "destructive" });
            return;
        }
        if (!passenger.firstName || !passenger.lastName || !passenger.passportNumber) {
            toast({ title: "Missing Fields", description: "Passenger name and passport number are required.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        try {
            // Store passenger and flight data to be used on the payment page
            const paymentData = {
                flight,
                passengerCounts,
                phone,
                email,
                passenger,
                remarks: isStaff ? remarks : undefined,
                totalPrice: passengerCounts.adults * (flight?.price || 0),
            };

            sessionStorage.setItem('pendingPayment', JSON.stringify(paymentData));
            router.push('/booking/payment');
        } catch (err: any) {
            toast({ title: "Validation Error", description: err.message || "Something went wrong.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!flight) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <PiSpinner className="h-8 w-8 animate-spin" style={{ color: '#2E0A57' }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-sm">
                <div className="container mx-auto px-4 md:px-8 max-w-6xl py-3 flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 text-gray-500 h-8">
                        <PiArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <span className="text-sm font-semibold text-gray-700">Passenger Details</span>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 max-w-6xl py-10">
                <form onSubmit={handleSubmit}>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* ── Left: Forms ── */}
                        <div className="lg:col-span-2 space-y-5">
                            <h1 className="text-2xl font-black text-gray-900">Passenger Details</h1>

                            {/* Contact Information */}
                            <Card className="shadow-sm border-gray-100">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                                        <PiPhone className="h-4 w-4" style={{ color: '#2E0A57' }} />
                                        Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">Phone Number *</Label>
                                        <Input
                                            placeholder="+966 50 000 0000"
                                            className="rounded-xl border-gray-200 focus-visible:ring-[#6C2BD9]"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">Email Address *</Label>
                                        <Input
                                            type="email"
                                            placeholder="passenger@email.com"
                                            className="rounded-xl border-gray-200 focus-visible:ring-[#6C2BD9]"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Passenger Details */}
                            <Card className="shadow-sm border-gray-100">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                                        <PiUser className="h-4 w-4" style={{ color: '#2E0A57' }} />
                                        Passenger 1 — {isStaff && passenger.passengerType
                                            ? passenger.passengerType === 'ADULT_MALE' ? 'Adult Male'
                                            : passenger.passengerType === 'ADULT_FEMALE' ? 'Adult Female'
                                            : passenger.passengerType === 'CHILD' ? 'Child'
                                            : passenger.passengerType === 'INFANT' ? 'Infant'
                                            : 'Adult'
                                            : 'Adult'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">Title *</Label>
                                        <Select defaultValue="Mr" onValueChange={v => updatePassenger('title', v)}>
                                            <SelectTrigger className="rounded-xl border-gray-200 focus:ring-[#6C2BD9]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["Mr", "Mrs", "Ms", "Dr"].map(t => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {isStaff && (
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-gray-600">Passenger Type *</Label>
                                            <Select
                                                defaultValue="ADULT_MALE"
                                                onValueChange={v => {
                                                    updatePassenger('passengerType' as any, v);
                                                    // Auto-set title based on type
                                                    if (v === 'ADULT_MALE') updatePassenger('title', 'Mr');
                                                    else if (v === 'ADULT_FEMALE') updatePassenger('title', 'Mrs');
                                                }}
                                            >
                                                <SelectTrigger className="rounded-xl border-gray-200 focus:ring-[#6C2BD9]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ADULT_MALE">Adult - Male</SelectItem>
                                                    <SelectItem value="ADULT_FEMALE">Adult - Female</SelectItem>
                                                    <SelectItem value="CHILD">Child</SelectItem>
                                                    <SelectItem value="INFANT">Infant</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">Nationality *</Label>
                                        <Input placeholder="e.g. Saudi Arabia" className="rounded-xl border-gray-200 focus-visible:ring-[#6C2BD9]"
                                            onChange={e => updatePassenger('nationality', e.target.value)} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">First Name *</Label>
                                        <Input placeholder="As in passport" className="rounded-xl border-gray-200 focus-visible:ring-[#6C2BD9]"
                                            onChange={e => updatePassenger('firstName', e.target.value)} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">Last Name *</Label>
                                        <Input placeholder="As in passport" className="rounded-xl border-gray-200 focus-visible:ring-[#6C2BD9]"
                                            onChange={e => updatePassenger('lastName', e.target.value)} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">Date of Birth *</Label>
                                        <Input type="date" className="rounded-xl border-gray-200 focus-visible:ring-[#6C2BD9]"
                                            onChange={e => updatePassenger('dateOfBirth', e.target.value)} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">Passport Expiry *</Label>
                                        <Input type="date" className="rounded-xl border-gray-200 focus-visible:ring-[#6C2BD9]"
                                            onChange={e => updatePassenger('passportExpiry', e.target.value)} required />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Passport Info */}
                            <Card className="shadow-sm border-gray-100">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                                        <PiCreditCard className="h-4 w-4" style={{ color: '#2E0A57' }} />
                                        Passport Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">Passport Number *</Label>
                                        <Input placeholder="A12345678" className="rounded-xl border-gray-200 focus-visible:ring-[#6C2BD9]"
                                            onChange={e => updatePassenger('passportNumber', e.target.value)} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">Country of Issue *</Label>
                                        <Input placeholder="e.g. Saudi Arabia" className="rounded-xl border-gray-200 focus-visible:ring-[#6C2BD9]"
                                            onChange={e => updatePassenger('countryOfIssue', e.target.value)} required />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Staff Remarks - Only show for staff */}
                            {isStaff && (
                                <Card className="shadow-sm border-gray-100">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                                            <PiNote className="h-4 w-4" style={{ color: '#2E0A57' }} />
                                            Staff Notes (Optional)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-1.5">
                                            <Input 
                                                placeholder="Walk-in Pax / Agent assignment / Special requests..." 
                                                className="rounded-xl border-gray-200 focus-visible:ring-[#6C2BD9]"
                                                value={remarks}
                                                onChange={e => setRemarks(e.target.value)}
                                            />
                                            <p className="text-[10px] text-gray-400">
                                                E.g., "Walk-in Pax", "Assign to Agent XYZ", "Urgent - VIP customer"
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full text-white font-bold rounded-xl h-12 text-base shadow-lg"
                                style={{ backgroundColor: '#2E0A57' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3B0F70')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2E0A57')}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <PiSpinner className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>Proceed to Payment <PiArrowRight className="h-5 w-5" /></>
                                )}
                            </Button>
                        </div>

                        {/* ── Right: Summary ── */}
                        <div className="lg:col-span-1">
                            <BookingSummaryCard
                                flight={flight}
                                passengerCounts={passengerCounts}
                            />
                        </div>
                    </motion.div>
                </form>
            </div>
        </div>
    );
}

export default function PassengersPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><PiSpinner className="h-8 w-8 animate-spin" style={{ color: '#2E0A57' }} /></div>}>
            <PassengersForm />
        </Suspense>
    );
}
