"use client";
import { PiAirplaneTakeoffLight, PiShieldCheckLight, PiCheckCircleLight } from "react-icons/pi";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { flyApi } from "@/lib/api";
import { FareSector } from "@/lib/types";
import { useRouter } from "next/navigation";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
    passengerName: z.string().min(2, "Name must be at least 2 characters."),
    passportNumber: z.string().min(5, "Passport number is required."),
    nationality: z.string().min(2, "Nationality is required."),
    phone: z.string().min(8, "Valid phone number required."),
    email: z.string().email("Valid email required."),
});

interface BookingModalProps {
    sector: FareSector | null;
    isOpen: boolean;
    onClose: () => void;
}

export function BookingModal({ sector, isOpen, onClose }: BookingModalProps) {
    const { toast } = useToast();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            passengerName: "",
            passportNumber: "",
            nationality: "",
            phone: "",
            email: "",
        },
    });

    const bookingMutation = useMutation({
        mutationFn: (values: z.infer<typeof formSchema>) => {
            if (!sector) throw new Error("No sector selected");
            return flyApi.bookings.create({
                sectorId: sector.id,
                ...values,
            });
        },
        onSuccess: (data) => {
            setSuccessBookingId(data.id.toUpperCase());
            queryClient.invalidateQueries({ queryKey: ["sectors"] });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
        },
        onError: (error: Error) => {
            if (error.message.includes("Unauthorized") || error.message.includes("401")) {
                toast({
                    title: "Authentication Required",
                    description: "Please log in to hold a ticket.",
                });
                onClose();
                router.push("/login");
                return;
            }

            toast({
                title: "Booking Failed",
                description: error.message || "An error occurred while booking.",
                variant: "destructive",
            });
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        bookingMutation.mutate(values);
    }

    const handleClose = () => {
        form.reset();
        setSuccessBookingId(null);
        onClose();
    };

    if (!sector) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-xl">
                {successBookingId ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <PiCheckCircleLight className="h-16 w-16 text-green-500 mb-2" />
                        <h2 className="text-2xl font-bold">Your ticket is HELD</h2>
                        <div className="bg-muted p-4 rounded-lg text-sm space-y-2 max-w-sm">
                            <p>Our team is processing your ticket.</p>
                            <p>You will receive the PNR shortly via email or WhatsApp.</p>
                        </div>
                        <p className="font-mono bg-primary/10 px-4 py-2 rounded-md font-semibold text-lg mt-4">
                            Booking ID: <span className="text-primary">{successBookingId}</span>
                        </p>
                        <Button className="mt-6" onClick={handleClose}>
                            Done
                        </Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                <PiAirplaneTakeoffLight className="h-6 w-6 text-primary" />
                                Book Ticket
                            </DialogTitle>
                            <DialogDescription className="text-lg">
                                Holding seats for {sector.originCode} to {sector.destinationCode}.
                                Total fare: <strong className="text-foreground text-xl">SAR {sector.price.toLocaleString()}</strong>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 p-3 mt-4 rounded-md flex items-start gap-3 text-sm">
                            <PiShieldCheckLight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-muted-foreground leading-tight text-primary dark:text-primary-foreground/80">
                                Tickets are processed with instant approval.
                                Our team will reach out immediately to finalize issuance.
                            </p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="passengerName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Passenger Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="passportNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Passport Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="A12345678" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="nationality"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nationality</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="India" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+91 98000 00000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="john@example.com" type="email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="pt-6 flex justify-end gap-3 border-t">
                                    <Button type="button" variant="ghost" onClick={handleClose} disabled={bookingMutation.isPending}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="lg" className="px-8 font-semibold w-full md:w-auto text-md" disabled={bookingMutation.isPending || sector.remainingSeats <= 0}>
                                        {bookingMutation.isPending ? "Hold please..." : "Book Ticket"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
