"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flyApi } from "@/lib/api";
import { FareSector } from "@/lib/types";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus, MoreHorizontal, Pencil, Sliders, Trash2,
    Lock, Unlock, AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/api";
import { motion } from "framer-motion";

type ModalType = "create" | "edit" | "seats" | "delete" | "bookingStatus" | null;

const InputField = ({ label, name, type = "text", placeholder, required, value, onChange, min }: {
    label: string; name: string; type?: string; placeholder?: string; required?: boolean;
    value?: string | number; onChange?: (e: any) => void; min?: number;
}) => (
    <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">{label}{required && " *"}</Label>
        <Input type={type} name={name} placeholder={placeholder} required={required}
            className="rounded-xl border-gray-200 focus-visible:ring-violet-400 text-sm"
            value={value} onChange={onChange} min={min} />
    </div>
);

export default function SectorManagement() {
    const qc = useQueryClient();
    const { toast } = useToast();

    const [modal, setModal] = useState<ModalType>(null);
    const [selected, setSelected] = useState<FareSector | null>(null);
    const [form, setForm] = useState<any>({});
    const [targetStatus, setTargetStatus] = useState<"OPEN" | "CLOSED">("OPEN");

    const { data: sectors, isLoading } = useQuery({
        queryKey: ["sectors"],
        queryFn: flyApi.sectors.list,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => flyApi.sectors.create(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["sectors"] }); toast({ title: "Route Created" }); closeModal(); },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => flyApi.sectors.update(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["sectors"] }); toast({ title: "Updated Successfully" }); closeModal(); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => flyApi.sectors.delete(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["sectors"] }); toast({ title: "Route Deleted" }); closeModal(); },
    });

    const openModal = (type: ModalType, sector?: FareSector) => {
        setModal(type);
        setSelected(sector || null);
        setForm(sector ? { ...sector } : {});
    };
    const closeModal = () => { setModal(null); setSelected(null); setForm({}); };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            origin: form.origin,
            destination: form.destination,
            price: parseFloat(form.price),
            totalSeats: parseInt(form.totalSeats),
            remainingSeats: parseInt(form.remainingSeats || form.totalSeats),
            departureDate: form.departureDate,
            airline: form.airline,
            flightNumber: form.flightNumber,
            departureTime: form.departureTime,
            arrivalTime: form.arrivalTime,
            baggage: form.baggage,
            airlineLogo: form.airlineLogo,
            layover: form.layover,
            flightRules: form.flightRules,
            flightDetails: form.flightDetails,
        });
    };

    const handleEditFare = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        updateMutation.mutate({ id: selected.id, data: { price: parseFloat(form.price), departureDate: form.departureDate, baggage: form.baggage, flightNumber: form.flightNumber, layover: form.layover, flightRules: form.flightRules, flightDetails: form.flightDetails, airlineLogo: form.airlineLogo } });
    };

    const handleAdjustSeats = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        const total = parseInt(form.totalSeats);
        const rem = parseInt(form.remainingSeats);
        if (rem > total) { toast({ title: "Validation Error", description: "Remaining seats cannot exceed total seats.", variant: "destructive" }); return; }
        updateMutation.mutate({ id: selected.id, data: { totalSeats: total, remainingSeats: rem } });
    };

    const handleBookingStatus = async () => {
        if (!selected) return;
        try {
            await flyApi.sectors.updateBookingStatus(selected.id, targetStatus);
            qc.invalidateQueries({ queryKey: ["sectors"] });
            toast({ title: `Booking ${targetStatus}` });
            closeModal();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    if (isLoading) return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-60 rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
    );

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Sector Management</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Manage special fares, inventory, and pricing.</p>
                </div>
                <Button
                    className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2 font-semibold"
                    onClick={() => openModal("create")}
                >
                    <Plus className="h-4 w-4" />
                    Create Route
                </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 border-gray-100">
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Route</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Flight</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Price</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Inventory</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sectors?.map((sector, i) => (
                            <motion.tr
                                key={sector.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="hover:bg-gray-50 border-gray-100 transition-colors"
                            >
                                <TableCell className="font-bold text-gray-900">
                                    {sector.originCode}
                                    <span className="text-gray-300 mx-1.5">→</span>
                                    {sector.destinationCode}
                                    <p className="text-xs text-gray-400 font-normal mt-0.5">{sector.departureDate}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: "#F3F0FF", display: "flex",
                                            alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden"
                                        }}>
                                            {sector.airlineLogo ? (
                                                <img src={sector.airlineLogo} alt={sector.airline} width={28} height={28} style={{ objectFit: "contain" }} />
                                            ) : (
                                                <span style={{ fontSize: 14 }}>✈️</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800">{sector.airline}</p>
                                            <p className="text-xs text-gray-400 font-mono">{sector.flightNumber}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-black text-violet-600 text-base">SAR {sector.price.toLocaleString()}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs space-y-0.5">
                                        <p className="text-gray-500">Total: <span className="font-bold text-gray-800">{sector.totalSeats}</span></p>
                                        <p className="text-emerald-600 font-semibold">Rem: {sector.remainingSeats}</p>
                                        <p className="text-amber-500">Held: {sector.heldSeats}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {sector.bookingStatus === "OPEN" && sector.remainingSeats > 0 ? (
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold" variant="outline">Active</Badge>
                                    ) : (
                                        <Badge variant="destructive" className="font-semibold">{sector.bookingStatus === "CLOSED" ? "Closed" : "Sold Out"}</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-gray-100">
                                            <DropdownMenuLabel className="text-xs text-gray-400">Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openModal("edit", sector)}>
                                                <Pencil className="h-3.5 w-3.5" /> Edit Fare
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openModal("seats", sector)}>
                                                <Sliders className="h-3.5 w-3.5" /> Adjust Seats
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => { setSelected(sector); setTargetStatus("OPEN"); openModal("bookingStatus", sector); }}>
                                                <Unlock className="h-3.5 w-3.5" /> Open Booking
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => { setSelected(sector); setTargetStatus("CLOSED"); openModal("bookingStatus", sector); }}>
                                                <Lock className="h-3.5 w-3.5" /> Close Booking
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="gap-2 text-red-600 font-semibold cursor-pointer" onClick={() => openModal("delete", sector)}>
                                                <Trash2 className="h-3.5 w-3.5" /> Delete Route
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </motion.tr>
                        ))}
                        {sectors?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                                    No routes found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ─── CREATE MODAL ─── */}
            <Dialog open={modal === "create"} onOpenChange={() => closeModal()}>
                <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-black text-lg">Create New Route</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <InputField label="Origin Airport" name="origin" placeholder="e.g. RUH" required value={form.origin || ""} onChange={e => setForm({ ...form, origin: e.target.value })} />
                            <InputField label="Destination Airport" name="destination" placeholder="e.g. COK" required value={form.destination || ""} onChange={e => setForm({ ...form, destination: e.target.value })} />
                            <InputField label="Airline" name="airline" placeholder="e.g. Saudia Airlines" value={form.airline || ""} onChange={e => setForm({ ...form, airline: e.target.value })} />
                            <InputField label="Flight Number" name="flightNumber" placeholder="e.g. SV891" value={form.flightNumber || ""} onChange={e => setForm({ ...form, flightNumber: e.target.value })} />
                            <InputField label="Departure Time" name="departureTime" placeholder="e.g. 11:35" value={form.departureTime || ""} onChange={e => setForm({ ...form, departureTime: e.target.value })} />
                            <InputField label="Arrival Time" name="arrivalTime" placeholder="e.g. 18:50" value={form.arrivalTime || ""} onChange={e => setForm({ ...form, arrivalTime: e.target.value })} />
                            <InputField label="Travel Date" name="departureDate" type="date" required value={form.departureDate || ""} onChange={e => setForm({ ...form, departureDate: e.target.value })} />
                            <InputField label="Price (SAR)" name="price" type="number" placeholder="e.g. 1300" required value={form.price || ""} onChange={e => setForm({ ...form, price: e.target.value })} />
                            <InputField label="Total Seats" name="totalSeats" type="number" placeholder="e.g. 150" required value={form.totalSeats || ""} onChange={e => setForm({ ...form, totalSeats: e.target.value })} />
                            <InputField label="Remaining Seats" name="remainingSeats" type="number" placeholder="e.g. 45" value={form.remainingSeats || ""} onChange={e => setForm({ ...form, remainingSeats: e.target.value })} />
                            <InputField label="Baggage Allowance" name="baggage" placeholder="e.g. 2PC / 30kg" value={form.baggage || ""} onChange={e => setForm({ ...form, baggage: e.target.value })} />
                            <InputField label="Stop Details" name="stops" placeholder="e.g. 1 stop via MCT" value={form.stops || ""} onChange={e => setForm({ ...form, stops: e.target.value })} />
                            <InputField label="Airline Logo URL" name="airlineLogo" placeholder="e.g. /saudia-logo.png" value={form.airlineLogo || ""} onChange={e => setForm({ ...form, airlineLogo: e.target.value })} />
                            <InputField label="Layover" name="layover" placeholder="e.g. 2h in Dubai" value={form.layover || ""} onChange={e => setForm({ ...form, layover: e.target.value })} />
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Flight Rules</Label>
                                <Input name="flightRules" placeholder="e.g. Non-refundable, Change fee applies" className="rounded-xl border-gray-200 focus-visible:ring-violet-400 text-sm" value={form.flightRules || ""} onChange={e => setForm({ ...form, flightRules: e.target.value })} />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Flight Details</Label>
                                <Input name="flightDetails" placeholder="e.g. Boeing 777, Meals included" className="rounded-xl border-gray-200 focus-visible:ring-violet-400 text-sm" value={form.flightDetails || ""} onChange={e => setForm({ ...form, flightDetails: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl" disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Creating..." : "Create Route"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── EDIT FARE MODAL ─── */}
            <Dialog open={modal === "edit"} onOpenChange={() => closeModal()}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black">Edit Fare</DialogTitle>
                        <p className="text-sm text-gray-400">{selected?.originCode} → {selected?.destinationCode}</p>
                    </DialogHeader>
                    <form onSubmit={handleEditFare}>
                        <div className="space-y-3 py-4">
                            <InputField label="Price (SAR)" name="price" type="number" required value={form.price || ""} onChange={e => setForm({ ...form, price: e.target.value })} />
                            <InputField label="Travel Date" name="departureDate" type="date" value={form.departureDate || ""} onChange={e => setForm({ ...form, departureDate: e.target.value })} />
                            <InputField label="Baggage" name="baggage" placeholder="e.g. 2PC" value={form.baggage || ""} onChange={e => setForm({ ...form, baggage: e.target.value })} />
                            <InputField label="Flight Number" name="flightNumber" placeholder="e.g. SV891" value={form.flightNumber || ""} onChange={e => setForm({ ...form, flightNumber: e.target.value })} />
                            <InputField label="Airline Logo URL" name="airlineLogo" placeholder="e.g. /saudia-logo.png" value={form.airlineLogo || ""} onChange={e => setForm({ ...form, airlineLogo: e.target.value })} />
                            <InputField label="Layover" name="layover" placeholder="e.g. 2h layover in Doha" value={form.layover || ""} onChange={e => setForm({ ...form, layover: e.target.value })} />
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Flight Rules</Label>
                                <Input name="flightRules" placeholder="e.g. Non-refundable" className="rounded-xl border-gray-200 focus-visible:ring-violet-400 text-sm" value={form.flightRules || ""} onChange={e => setForm({ ...form, flightRules: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Flight Details</Label>
                                <Input name="flightDetails" placeholder="e.g. Economy Class, Boeing 777" className="rounded-xl border-gray-200 focus-visible:ring-violet-400 text-sm" value={form.flightDetails || ""} onChange={e => setForm({ ...form, flightDetails: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── ADJUST SEATS MODAL ─── */}
            <Dialog open={modal === "seats"} onOpenChange={() => closeModal()}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black">Adjust Seats</DialogTitle>
                        <p className="text-sm text-gray-400">{selected?.originCode} → {selected?.destinationCode}</p>
                    </DialogHeader>
                    <form onSubmit={handleAdjustSeats}>
                        <div className="space-y-3 py-4">
                            <InputField label="Total Seats" name="totalSeats" type="number" required min={1} value={form.totalSeats || ""} onChange={e => setForm({ ...form, totalSeats: e.target.value })} />
                            <InputField label="Remaining Seats" name="remainingSeats" type="number" required min={0} value={form.remainingSeats || ""} onChange={e => setForm({ ...form, remainingSeats: e.target.value })} />
                            {parseInt(form.remainingSeats) > parseInt(form.totalSeats) && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Remaining cannot exceed total seats
                                </p>
                            )}
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "Updating..." : "Update Seats"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── BOOKING STATUS MODAL ─── */}
            <Dialog open={modal === "bookingStatus"} onOpenChange={() => closeModal()}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black flex items-center gap-2">
                            {targetStatus === "OPEN" ? <Unlock className="h-5 w-5 text-emerald-600" /> : <Lock className="h-5 w-5 text-red-500" />}
                            {targetStatus === "OPEN" ? "Open Booking" : "Close Booking"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to <strong>{targetStatus === "OPEN" ? "open" : "close"}</strong> booking for{" "}
                            <strong>{selected?.originCode} → {selected?.destinationCode}</strong>?
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={closeModal}>Cancel</Button>
                        <Button
                            className={`rounded-xl text-white ${targetStatus === "OPEN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
                            onClick={handleBookingStatus}
                        >
                            {targetStatus === "OPEN" ? "Open Booking" : "Close Booking"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── DELETE MODAL ─── */}
            <Dialog open={modal === "delete"} onOpenChange={() => closeModal()}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-red-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" /> Delete Route
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-3 mb-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">
                                This action cannot be undone. All bookings for this route will be affected.
                            </p>
                        </div>
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete <strong>{selected?.originCode} → {selected?.destinationCode}</strong>?
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={closeModal}>Cancel</Button>
                        <Button variant="destructive" className="rounded-xl" onClick={() => selected && deleteMutation.mutate(selected.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Deleting..." : "Delete Route"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
