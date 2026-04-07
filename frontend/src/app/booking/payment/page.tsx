"use client";
import { PiUploadSimple, PiCheckCircle, PiArrowLeft, PiSpinner, PiBuildings, PiReceipt, PiImage } from "react-icons/pi";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { API_BASE, fetchWithCreds } from "@/lib/api";
import { BookingSummaryCard } from "@/components/booking/booking-summary-card";
import Link from "next/link";
function PaymentForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [bookingData, setBookingData] = useState<any>(null);
    const [transactionId, setTransactionId] = useState("");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.replace("/login");
            return;
        }

        const userStr = localStorage.getItem("user");
        if (userStr) setUser(JSON.parse(userStr));
        
        const stored = sessionStorage.getItem("pendingPayment");
        if (stored) {
            setBookingData(JSON.parse(stored));
        } else {
            router.replace("/");
        }
    }, [router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setReceiptFile(file);
        if (file && file.type.startsWith("image/")) {
            const previewUrl = URL.createObjectURL(file);
            setReceiptPreview(previewUrl);
        } else {
            setReceiptPreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (paymentMethod === "BANK_TRANSFER" && !transactionId.trim()) {
            toast({
                title: "Required Field",
                description: "Please enter your transaction ID or receipt number.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const { flight, passenger, phone, email, passengerCounts, remarks, selectedAgentId } = bookingData;

            // 1) PiUploadSimple receipt if provided
            let receiptUrl: string | undefined = undefined;
            if (paymentMethod === "BANK_TRANSFER" && receiptFile) {
                const formData = new FormData();
                formData.append("file", receiptFile);
                try {
                    const data = await fetchWithCreds(`/bookings/upload-receipt`, {
                        method: "POST",
                        body: formData,
                    });
                    receiptUrl = data.url;
                } catch (e) {
                    console.error("Failed to upload receipt:", e);
                }
            }

            // 2) Create booking in backend using the flight.id (which is the route UUID)
            let dbBookingId: string | null = null;
            let bookingStatus = "PENDING";

            // The flight.id is the UUID from the backend's Route model
            const routeId = flight.id;

            if (routeId) {
                try {
                    const booking = await fetchWithCreds(`/bookings`, {
                        method: "POST",
                        body: JSON.stringify({
                            routeId: routeId,
                            passengerName: `${passenger.title || "Mr"} ${passenger.firstName} ${passenger.lastName}`,
                            passportNumber: passenger.passportNumber,
                            email,
                            phone,
                            gender: passenger.gender,
                            passengerType: passenger.passengerType,
                            nationality: passenger.nationality,
                            dateOfBirth: passenger.dateOfBirth,
                            passportExpiry: passenger.passportExpiry,
                            transactionId: paymentMethod === "CREDIT" ? "AGENT_CREDIT" : transactionId,
                            paymentReceipt: receiptUrl,
                            paymentMethod: paymentMethod,
                            remarks: remarks || undefined,
                            agentDetails: selectedAgentId ? `Assigned Agent: ${selectedAgentId}` : undefined,
                        }),
                        credentials: "include",
                    });

                    dbBookingId = booking.id;
                    bookingStatus = booking.status || "PENDING";
                } catch (apiErr: any) {
                    console.error("Failed to save booking to backend:", apiErr);
                    if (apiErr.message?.includes("Authentication required")) {
                        // Redirect already handled by fetchWithCreds via window.location.href
                        return;
                    }
                    toast({
                        title: "Booking Failed",
                        description: apiErr.message || "An error occurred while creating your booking.",
                        variant: "destructive",
                    });
                    return; // Stop flow
                }
            } else {
                console.error("No flight ID found in booking data");
            }

            // 3) Store confirmation data for next page
            const bookingRef = dbBookingId
                ? `FLY${dbBookingId.slice(0, 8).toUpperCase()}`
                : `FLY${Date.now().toString().slice(-8)}`;

            const finalConfirmation = {
                bookingRef,
                dbBookingId,
                flight,
                passengerCounts,
                phone,
                email,
                passenger,
                totalPrice: passengerCounts.adults * (flight?.price || 0),
                status: bookingStatus,
                transactionId,
                paymentReceipt: receiptUrl,
            };

            sessionStorage.setItem("bookingConfirmation", JSON.stringify(finalConfirmation));
            sessionStorage.removeItem("pendingPayment");
            router.push("/booking/confirmation");

        } catch (err: any) {
            toast({ title: "Booking Error", description: err.message || "Failed to process payment.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!bookingData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <PiSpinner className="h-8 w-8 animate-spin" style={{ color: '#2E0A57' }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="container mx-auto max-w-6xl px-4 md:px-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/booking/passengers" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#6C2BD9] mb-2 transition-colors">
                            <PiArrowLeft className="h-4 w-4 mr-1" />
                            Back to Details
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payment Details</h1>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {user?.role === 'AGENT' && (
                            <Card className="rounded-2xl border-2 border-[#6C2BD9]/20 bg-white overflow-hidden shadow-sm">
                                <CardHeader className="bg-[#6C2BD9]/5 border-b border-[#6C2BD9]/10">
                                    <CardTitle className="text-[#2E0A57] flex items-center gap-2">
                                        <PiCheckCircle className="h-5 w-5 text-[#6C2BD9]" />
                                        Agent Booking Options
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="flex flex-col gap-4">
                                        <p className="text-sm text-gray-600">As a certified agent, you can choose to book using your pre-allocated credit limit.</p>
                                        <div className="flex gap-4">
                                            <Button 
                                                type="button"
                                                variant={paymentMethod === "CREDIT" ? "default" : "outline"}
                                                className={`flex-1 rounded-xl h-14 ${paymentMethod === "CREDIT" ? "bg-[#2E0A57] text-white shadow-md border-none" : "border-gray-200 text-gray-500"}`}
                                                onClick={() => setPaymentMethod("CREDIT")}
                                            >
                                                Book on Credit
                                            </Button>
                                            <Button 
                                                type="button"
                                                variant={paymentMethod === "BANK_TRANSFER" ? "default" : "outline"}
                                                className={`flex-1 rounded-xl h-14 ${paymentMethod === "BANK_TRANSFER" ? "bg-[#2E0A57] text-white shadow-md border-none" : "border-gray-200 text-gray-500"}`}
                                                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                                            >
                                                Bank Transfer
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Bank Info Card - only show if bank transfer selected */}
                        {paymentMethod === "BANK_TRANSFER" && (
                            <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden">
                                <CardHeader className="bg-white border-b border-gray-100 pb-4">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <PiBuildings className="h-5 w-5" style={{ color: '#2E0A57' }} />
                                        Bank Transfer Details
                                    </CardTitle>
                                    <CardDescription>
                                        Please transfer the total amount to the following bank account to confirm your booking.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 bg-gray-50/50">
                                    <div className="space-y-4">
                                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                                <span className="text-sm font-medium text-gray-500">Bank Name</span>
                                                <span className="font-bold text-gray-900">AL Rajhi Bank</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                                <span className="text-sm font-medium text-gray-500">Company Name</span>
                                                <span className="font-bold text-gray-900 text-right max-w-xs">FLYINCO FOR TRAVEL AND TOURISM COMPANY</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                                <span className="text-sm font-medium text-gray-500">Account Number</span>
                                                <span className="font-mono font-bold tracking-widest text-[#6C2BD9]">321608010168341</span>
                                            </div>
                                            <div className="flex items-start justify-between pt-1">
                                                <span className="text-sm font-medium text-gray-500 shrink-0">IBAN</span>
                                                <span className="font-mono font-bold text-gray-900 text-right break-all ml-4">SA 2480000321608010168341</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl text-sm border border-[#EDE9FE] bg-[#F5F3FF] flex gap-3" style={{ color: '#2E0A57' }}>
                                            <PiCheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#6C2BD9' }} />
                                            <p>
                                                <strong>Amount to transfer: </strong>
                                                <span className="font-black text-lg ml-1">SAR {bookingData.totalPrice.toLocaleString()}</span>
                                                <br />
                                                <span className="mt-1 inline-block" style={{ color: '#6C2BD9' }}>Please make the exact transfer amount. Include your name in the transfer notes.</span>
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Credit Booking Info */}
                        {paymentMethod === "CREDIT" && (
                            <Card className="rounded-2xl border-emerald-100 bg-emerald-50/20 overflow-hidden shadow-sm">
                                <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
                                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                                        <PiCheckCircle className="h-5 w-5 text-emerald-600" />
                                        Credit Booking Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-emerald-100">
                                            <span className="text-sm text-gray-600 font-medium">Amount to be added to Dues:</span>
                                            <span className="text-xl font-black text-emerald-700">SAR {bookingData.totalPrice.toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2 px-1 italic">Note: This booking will show up in your pending dues immediately. The admin will review and issue the ticket following their standard workflow.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Confirm Payment Form */}
                        <form onSubmit={handleSubmit}>
                            <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden">
                                <CardHeader className="bg-white border-b border-gray-100 pb-4">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <PiReceipt className="h-5 w-5" style={{ color: '#2E0A57' }} />
                                        Confirm {paymentMethod === "CREDIT" ? "Credit Booking" : "Payment"}
                                    </CardTitle>
                                    <CardDescription>
                                        {paymentMethod === "CREDIT" 
                                            ? "Confirm your reservation using your agent credit account." 
                                            : "Upload your transfer receipt or provide the transaction ID below."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    {paymentMethod === "BANK_TRANSFER" ? (
                                        <>
                                            {/* Transaction ID */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-700">
                                                    Transaction ID / Reference Number <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    placeholder="e.g. TR-98219030"
                                                    value={transactionId}
                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                    required
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>

                                            {/* File PiUploadSimple */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-700">Upload Receipt Screenshot (Optional)</Label>
                                                <label
                                                    htmlFor="receipt-upload"
                                                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group block"
                                                >
                                                    {receiptPreview ? (
                                                        <div className="w-full flex flex-col items-center gap-2">
                                                            <img
                                                                src={receiptPreview}
                                                                alt="Receipt preview"
                                                                className="max-h-48 rounded-lg object-contain border border-gray-200 shadow-sm"
                                                            />
                                                            <p className="text-xs font-semibold mt-2" style={{ color: '#2E0A57' }}>{receiptFile?.name}</p>
                                                            <p className="text-xs text-gray-400">Click to change</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="p-3 rounded-full mb-3 transition-colors" style={{ backgroundColor: '#F5F3FF', color: '#2E0A57' }}>
                                                                {receiptFile ? <PiImage className="h-6 w-6" /> : <PiUploadSimple className="h-6 w-6" />}
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-700">
                                                                {receiptFile ? receiptFile.name : "Click to upload or drag and drop"}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG or PDF (Max. 5MB)</p>
                                                        </>
                                                    )}
                                                    <input
                                                        id="receipt-upload"
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*,.pdf"
                                                        onChange={handleFileChange}
                                                    />
                                                </label>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 text-emerald-800">
                                            <PiCheckCircle className="h-6 w-6" />
                                            <p className="font-semibold">Ready to confirm your credit booking.</p>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-gray-50 border-t border-gray-100 p-6">
                                    <Button
                                        type="submit"
                                        className="w-full text-white font-bold h-14 text-lg rounded-xl shadow-lg gap-2"
                                        style={{ backgroundColor: paymentMethod === 'CREDIT' ? '#10B981' : '#2E0A57' }}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <><PiSpinner className="h-5 w-5 animate-spin" /> Processing...</>
                                        ) : (
                                            <><PiCheckCircle className="h-5 w-5" /> {paymentMethod === "CREDIT" ? "Confirm Credit Booking" : "Submit & Confirm"}</>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="space-y-6">
                        <BookingSummaryCard
                            flight={bookingData.flight}
                            passengerCounts={bookingData.passengerCounts}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><PiSpinner className="h-8 w-8 animate-spin" style={{ color: '#2E0A57' }} /></div>}>
            <PaymentForm />
        </Suspense>
    );
}
