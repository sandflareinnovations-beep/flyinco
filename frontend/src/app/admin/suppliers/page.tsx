"use client";
import { 
    PiTruck, 
    PiCurrencyDollar, 
    PiBriefcase, 
    PiPlus, 
    PiDownloadSimple, 
    PiCheckCircle, 
    PiClock, 
    PiTrash,
    PiBank,
    PiReceipt,
    PiMagnifyingGlass,
    PiCaretRight
} from "react-icons/pi";
import { useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
// XLSX loaded dynamically on export to reduce bundle size

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { flyApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LoadingLogo } from "@/components/ui/loading-logo";

const B = { primary: "#2E0A57", accent: "#6C2BD9" };

export default function SupplierManagement() {
    const [suppliers, setSuppliers] = useState<string[]>([]);
    const [supplierSummary, setSupplierSummary] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [supplierBookings, setSupplierBookings] = useState<any[]>([]);
    const [supplierPayments, setSupplierPayments] = useState<any[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [loadingLedger, setLoadingLedger] = useState(false);
    const [formData, setFormData] = useState({ amount: "", reference: "", notes: "" });
    const { toast } = useToast();

    const fetchSuppliers = useCallback(async () => {
        setIsLoading(true);
        try {
            const [namesData, summaryData] = await Promise.all([
                flyApi.bookings.listSuppliers(),
                flyApi.bookings.getSupplierSummary().catch(() => []),
            ]);
            setSuppliers(namesData || []);
            setSupplierSummary(summaryData || []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally { setIsLoading(false); }
    }, [toast]);

    useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => s.toLowerCase().includes(search.toLowerCase()));
    }, [suppliers, search]);

    const fetchLedger = async (name: string) => {
        setSelectedSupplier(name);
        setLoadingLedger(true);
        try {
            const [bookingsRes, paymentsRes] = await Promise.all([
                flyApi.bookings.list({ limit: 1000, supplier: name }),
                flyApi.payments.bySupplier(name)
            ]);
            
            const bookings = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes.bookings || []);
            setSupplierBookings(bookings);
            setSupplierPayments(paymentsRes);
        } catch (error: any) {
            toast({ title: "Error fetching ledger", description: error.message, variant: "destructive" });
        } finally { setLoadingLedger(false); }
    };

    const handleRecordPayment = async () => {
        if (!selectedSupplier || !formData.amount) return;
        try {
            await flyApi.payments.createSupplier({
                supplierName: selectedSupplier,
                amount: parseFloat(formData.amount),
                reference: formData.reference,
                notes: formData.notes
            });
            toast({ title: "Success", description: "Disbursement recorded successfully." });
            setShowPaymentModal(false);
            setFormData({ amount: "", reference: "", notes: "" });
            fetchLedger(selectedSupplier);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDeletePayment = async (id: string) => {
        if (!confirm("Are you sure you want to delete this payment record?")) return;
        try {
            await flyApi.payments.deleteSupplier(id);
            toast({ title: "Deleted", description: "Payment record removed." });
            fetchLedger(selectedSupplier!);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const stats = useMemo(() => {
        const totalPurchase = supplierBookings.reduce((acc, b) => acc + (b.purchasePrice || 0), 0);
        const totalPaid = supplierPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
        const balance = totalPurchase - totalPaid;
        return { totalPurchase, totalPaid, balance };
    }, [supplierBookings, supplierPayments]);

    const handleExportExcel = async () => {
        if (!selectedSupplier) return;
        const data = [
            ...supplierBookings.map(b => ({
                Date: format(new Date(b.createdAt), 'dd-MM-yyyy'),
                Type: 'PURCHASE',
                Description: `${b.passengerName} (${b.pnr})`,
                Debit: b.purchasePrice || 0,
                Credit: 0,
                Status: b.status
            })),
            ...supplierPayments.map(p => ({
                Date: format(new Date(p.createdAt), 'dd-MM-yyyy'),
                Type: 'DISBURSEMENT',
                Description: p.reference || 'N/A',
                Debit: 0,
                Credit: p.amount,
                Status: 'PAID'
            }))
        ].sort((a,b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Statement");
        XLSX.writeFile(wb, `${selectedSupplier}_Statement.xlsx`);
    };

    const globalTotals = useMemo(() => {
        return supplierSummary.reduce(
            (acc, s) => ({
                totalPurchase: acc.totalPurchase + (s.totalPurchase || 0),
                totalPaid: acc.totalPaid + (s.totalPaid || 0),
                totalOutstanding: acc.totalOutstanding + (s.outstanding || 0),
            }),
            { totalPurchase: 0, totalPaid: 0, totalOutstanding: 0 }
        );
    }, [supplierSummary]);

    const getSummaryFor = (name: string) => supplierSummary.find(s => s.supplierName === name);

    if (isLoading) return <LoadingLogo fullPage text="Loading Supplier Records..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase">Supplier Procurement</h1>
                    <p className="text-gray-400 text-sm">Manage disbursements and reconcile procurement statements.</p>
                </div>
                <div className="relative w-72">
                    <PiMagnifyingGlass className="absolute left-3 top-3 text-gray-400" />
                    <Input 
                        placeholder="Search suppliers..." 
                        className="pl-10 h-11 border-gray-200 rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Global Summary Cards */}
            {supplierSummary.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600">
                            <PiBriefcase className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Purchase</p>
                            <p className="text-lg font-black text-gray-900">SAR {globalTotals.totalPurchase.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                            <PiCheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Paid</p>
                            <p className="text-lg font-black text-emerald-700">SAR {globalTotals.totalPaid.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-red-50 text-red-600">
                            <PiCurrencyDollar className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Outstanding</p>
                            <p className="text-lg font-black text-red-600">SAR {globalTotals.totalOutstanding.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Suppliers List */}
                <Card className="border-gray-200 shadow-none rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <CardTitle className="text-sm font-black uppercase text-gray-600">Inventory Sources</CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Supplier Name</TableHead>
                                <TableHead className="text-center">Outstanding</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSuppliers.map((s) => {
                                const sum = getSummaryFor(s);
                                return (
                                    <TableRow key={s} className={selectedSupplier === s ? "bg-purple-50" : ""}>
                                        <TableCell>
                                            <p className="font-bold text-gray-800 uppercase text-xs">{s}</p>
                                            {sum && sum.totalBookings > 0 && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">{sum.totalBookings} bookings</p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {sum && sum.outstanding > 0 && (
                                                <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] font-bold" variant="outline">
                                                    Due: SAR {sum.outstanding.toLocaleString()}
                                                </Badge>
                                            )}
                                            {sum && sum.outstanding <= 0 && sum.totalPurchase > 0 && (
                                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] font-bold" variant="outline">
                                                    Settled
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => fetchLedger(s)}>
                                                <PiCaretRight className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>

                {/* Right: Statement / Actions */}
                <div className="space-y-6">
                    {selectedSupplier ? (
                        <>
                            <Card className="border-gray-200 shadow-none rounded-2xl">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-black text-gray-900 uppercase">{selectedSupplier}</CardTitle>
                                        <CardDescription>Procurement Account Statement</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="rounded-xl" onClick={handleExportExcel}>
                                            <PiDownloadSimple className="mr-2" /> Export
                                        </Button>
                                        <Button size="sm" className="rounded-xl text-white" style={{ backgroundColor: B.primary }} onClick={() => setShowPaymentModal(true)}>
                                            <PiPlus className="mr-2" /> Record Payout
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Purchase</p>
                                            <p className="text-sm font-black text-gray-800">SAR {stats.totalPurchase.toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Total Paid</p>
                                            <p className="text-sm font-black text-emerald-600">SAR {stats.totalPaid.toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                                            <p className="text-[10px] font-black text-orange-400 uppercase">Outstanding</p>
                                            <p className="text-sm font-black text-orange-600">SAR {stats.balance.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 max-h-[450px] overflow-y-auto">
                                        <p className="text-[10px] font-black text-gray-400 uppercase sticky top-0 bg-white py-2">Procurement Ledger</p>
                                        {loadingLedger ? (
                                            <div className="flex justify-center p-8"><PiClock className="animate-spin h-8 w-8 text-gray-200" /></div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {[
                                                    ...supplierBookings.map(b => ({ ...b, itemType: 'PURCHASE' })),
                                                    ...supplierPayments.map(p => ({ ...p, itemType: 'PAYMENT' }))
                                                ].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((item: any) => (
                                                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.itemType === 'PURCHASE' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                {item.itemType === 'PURCHASE' ? <PiReceipt /> : <PiBank />}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-800 uppercase tracking-tight">
                                                                    {item.itemType === 'PURCHASE' ? item.passengerName : 'Disbursement'}
                                                                </p>
                                                                <p className="text-[9px] text-gray-400 font-medium">
                                                                    {format(new Date(item.createdAt), 'dd MMM yyyy')} | {item.itemType === 'PURCHASE' ? (item.pnr || 'NO PNR') : (item.reference || 'No Ref')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-xs font-black ${item.itemType === 'PURCHASE' ? 'text-gray-900' : 'text-emerald-600'}`}>
                                                                {item.itemType === 'PURCHASE' ? `+ SAR ${(item.purchasePrice || 0).toLocaleString()}` : `- SAR ${(item.amount || 0).toLocaleString()}`}
                                                            </p>
                                                            {item.itemType === 'PAYMENT' && (
                                                                <button onClick={() => handleDeletePayment(item.id)} className="text-[9px] text-red-300 hover:text-red-500 hover:underline">Delete Record</button>
                                                            )}
                                                            {item.itemType === 'PURCHASE' && (
                                                                <Badge variant="outline" className={`text-[8px] h-3.5 ${item.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    {item.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card className="border-gray-200 shadow-none rounded-2xl border-dashed h-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
                            <PiBriefcase className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-bold">Select a supplier to reconcile disbursements and procurement records.</p>
                        </Card>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Record Disbursement</DialogTitle>
                        <DialogDescription>Record a payment made to {selectedSupplier}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Amount Paid (SAR)</Label>
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                className="h-11 rounded-xl"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Reference (Optional)</Label>
                            <Input 
                                placeholder="Bank Ref, Check #, etc." 
                                className="h-11 rounded-xl"
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Notes (Internal)</Label>
                            <Input 
                                placeholder="Internal remarks..." 
                                className="h-11 rounded-xl"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                        <Button style={{ backgroundColor: B.primary }} className="text-white px-8" onClick={handleRecordPayment}>Save Record</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
