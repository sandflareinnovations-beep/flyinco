"use client";
import { 
    PiUsers, 
    PiWallet, 
    PiBriefcase, 
    PiPlus, 
    PiReceipt, 
    PiBank, 
    PiTrash,
    PiFileText,
    PiDownloadSimple,
    PiMagnifyingGlass,
    PiCaretRight,
    PiClock,
    PiMoney,
    PiWarning,
    PiDotsThreeVertical
} from "react-icons/pi";
import { useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
// XLSX loaded dynamically on export to reduce bundle size
import { motion, AnimatePresence } from "framer-motion";

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

export default function AdminAccounts() {
    const [agents, setAgents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [agentLedger, setAgentLedger] = useState<any[]>([]);
    const [agentPayments, setAgentPayments] = useState<any[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [loadingLedger, setLoadingLedger] = useState(false);
    const [savingRecord, setSavingRecord] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ amount: "", type: "PAYMENT", reference: "", notes: "" });
    const { toast } = useToast();

    const fetchAgents = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await flyApi.users.list({ limit: 1000 });
            const list = Array.isArray(data) ? data : (data.users || []);
            const agentList = list.filter((u: any) => u.role === 'AGENT');
            setAgents(agentList);
        } catch (error: any) {
            console.error("FETCH AGENTS ERROR:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally { setIsLoading(false); }
    }, [toast]);

    useEffect(() => { fetchAgents(); }, [fetchAgents]);

    const filteredAgents = useMemo(() => {
        return agents.filter(a => 
            a.name?.toLowerCase().includes(search.toLowerCase()) || 
            a.agencyName?.toLowerCase().includes(search.toLowerCase())
        );
    }, [agents, search]);

    const fetchLedger = async (agent: any) => {
        setSelectedAgent(agent);
        setAgentLedger([]); // Clear previous data immediately
        setAgentPayments([]);
        setLoadingLedger(true);
        try {
            // Fetch bookings by agentId — single query catches all bookings for this agent
            const [paymentsRes, bookingsRes] = await Promise.all([
                flyApi.payments.byAgent(agent.id),
                flyApi.bookings.list({ limit: 5000, agentId: agent.id }),
            ]);

            const allBookings = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes.bookings || []);

            // BUG FIX: Warn if we hit pagination limit (5000 bookings)
            if (allBookings.length >= 5000) {
                toast({
                    title: "⚠️ Data May Be Incomplete",
                    description: `Agent ${agent.name} has 5000+ bookings. Ledger display may be truncated. For complete reports, consider exporting.`,
                    variant: "destructive"
                });
                console.warn(`Agent ${agent.name} (${agent.id}) has 5000+ bookings - ledger may be incomplete`);
            }

            setAgentLedger(allBookings);
            setAgentPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
        } catch (error: any) {
            console.error("Ledger fetch error:", error);
            toast({ title: "Error fetching ledger", description: error.message, variant: "destructive" });
        } finally { setLoadingLedger(false); }
    };

    const handleRecordPayment = async () => {
        if (!selectedAgent || !formData.amount) return;
        setSavingRecord(true);
        try {
            await flyApi.payments.create({
                agentId: selectedAgent.id,
                amount: parseFloat(formData.amount),
                type: formData.type,
                reference: formData.reference,
                notes: formData.notes,
                status: 'COMPLETED'
            });
            toast({ title: "Success", description: "Payment recorded successfully." });
            setShowPaymentModal(false);
            setFormData({ amount: "", type: "PAYMENT", reference: "", notes: "" });

            // BUG FIX: Add delay to ensure backend processed the payment before refetching
            await new Promise(r => setTimeout(r, 300));

            // Refetch both ledger and agent list to get updated pendingDues from backend
            await fetchLedger(selectedAgent);
            const updatedAgents = await flyApi.users.list({ limit: 1000 });
            const list = Array.isArray(updatedAgents) ? updatedAgents : (updatedAgents.users || []);
            const agentList = list.filter((u: any) => u.role === 'AGENT');
            setAgents(agentList);

            // Update selectedAgent with fresh data
            const refreshedAgent = agentList.find((a: any) => a.id === selectedAgent.id);
            if (refreshedAgent) setSelectedAgent(refreshedAgent);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSavingRecord(false);
        }
    };

    const handleDeletePayment = async () => {
        if (!selectedPayment) return;
        setDeletingId(selectedPayment.id);
        try {
            await flyApi.payments.delete(selectedPayment.id);
            toast({ title: "Deleted", description: "Payment record removed." });
            setShowDeleteModal(false);
            setSelectedPayment(null);

            // BUG FIX: Add delay to ensure backend processed the deletion before refetching
            await new Promise(r => setTimeout(r, 300));

            // Refetch both ledger and agent list to get updated pendingDues from backend
            if (selectedAgent) {
                await fetchLedger(selectedAgent);
                const updatedAgents = await flyApi.users.list({ limit: 1000 });
                const list = Array.isArray(updatedAgents) ? updatedAgents : (updatedAgents.users || []);
                const agentList = list.filter((u: any) => u.role === 'AGENT');
                setAgents(agentList);

                // Update selectedAgent with fresh data
                const refreshedAgent = agentList.find((a: any) => a.id === selectedAgent.id);
                if (refreshedAgent) setSelectedAgent(refreshedAgent);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    const handleExportExcel = async () => {
        if (!selectedAgent) return;
        const data = [
            ...agentLedger.map(b => ({
                Date: format(new Date(b.createdAt), 'dd-MM-yyyy'),
                Type: 'BOOKING',
                Passenger: b.passengerName,
                Airline: b.airline || 'N/A',
                Sector: b.sector || 'N/A',
                PNR: b.pnr || 'N/A',
                Travel_Date: b.travelDate ? format(new Date(b.travelDate), 'dd-MM-yyyy') : 'N/A',
                Passport: b.passportNumber || 'N/A',
                Nationality: b.nationality || 'N/A',
                Phone: b.phone || 'N/A',
                Debit: b.sellingPrice || 0,
                Credit: 0,
                Status: b.paymentStatus
            })),
            ...agentPayments.map(p => ({
                Date: format(new Date(p.createdAt), 'dd-MM-yyyy'),
                Type: p.type,
                Passenger: 'N/A',
                Airline: 'N/A',
                Sector: 'N/A',
                PNR: 'N/A',
                Travel_Date: 'N/A',
                Passport: 'N/A',
                Nationality: 'N/A',
                Phone: 'N/A',
                Debit: 0,
                Credit: p.amount,
                Status: 'PAID'
            }))
        ].sort((a,b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ledger");
        XLSX.writeFile(wb, `${selectedAgent.name}_Reports.xlsx`);
    };

    const totalSalesRec = useMemo(() => {
        let invalidCount = 0;
        const sum = agentLedger.reduce((sum, b) => {
            if (b.sellingPrice === null || b.sellingPrice === undefined || isNaN(b.sellingPrice)) {
                invalidCount++;
                console.warn(`Booking ${b.id} has invalid sellingPrice:`, b.sellingPrice);
            }
            return sum + (b.sellingPrice || 0);
        }, 0);
        if (invalidCount > 0) {
            console.warn(`${invalidCount} bookings have invalid sellingPrice`);
        }
        return sum;
    }, [agentLedger]);

    const totalPaymentsRec = useMemo(() => agentPayments.reduce((sum, p) => sum + (p.amount || 0), 0), [agentPayments]);

    // BUG FIX: Use backend-maintained pendingDues instead of calculating from partial data
    // The backend value is the source of truth and includes historical balances
    const dynamicDues = selectedAgent?.pendingDues || 0;

    // Optimized transaction list memoization
    const sortedTransactions = useMemo(() => {
        return [
            ...agentLedger.map(b => ({ ...b, itemType: 'BOOKING' })),
            ...agentPayments.map(p => ({ ...p, itemType: 'PAYMENT' }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [agentLedger, agentPayments]);

    if (isLoading) return <LoadingLogo fullPage text="Loading Financial Records..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase">Agent Accounting</h1>
                    <p className="text-gray-400 text-sm">Manage agent statements, record payments, and monitor dues.</p>
                </div>
                <div className="relative w-72">
                    <PiMagnifyingGlass className="absolute left-3 top-3 text-gray-400" />
                    <Input 
                        placeholder="Search agents..." 
                        className="pl-10 h-11 border-gray-200 rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Agents List */}
                <Card className="border-gray-200 shadow-none rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <CardTitle className="text-sm font-black uppercase text-gray-600">Select Agent</CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent / Agency</TableHead>
                                <TableHead className="text-right">Unpaid Amount</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAgents.length > 0 ? filteredAgents.map((agent) => (
                                <TableRow key={agent.id} className={selectedAgent?.id === agent.id ? "bg-purple-50" : "hover:bg-gray-50 transition-colors cursor-pointer"} onClick={() => fetchLedger(agent)}>
                                    <TableCell>
                                        <p className="font-bold text-gray-800 tracking-tight">{agent.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase">{agent.agencyName || 'INDIVIDUAL AGENT'}</p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`font-black ${(agent.pendingDues || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            SAR {(agent.pendingDues || 0).toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="rounded-md hover:bg-white hover:shadow-sm" onClick={(e) => { e.stopPropagation(); fetchLedger(agent); }}>
                                            <PiCaretRight className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-32 text-center text-gray-400 font-medium italic">
                                        No agents found in results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Right: Statement / Actions */}
                <div className="space-y-6">
                    {selectedAgent ? (
                        <>
                            <Card className="border-gray-200 shadow-none rounded-2xl">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-black text-gray-900">{selectedAgent.name}</CardTitle>
                                        <CardDescription>Statement for {selectedAgent.agencyName}</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="rounded-xl" onClick={handleExportExcel}>
                                            <PiDownloadSimple className="mr-2" /> Export
                                        </Button>
                                        <Button size="sm" className="rounded-xl text-white" style={{ backgroundColor: B.primary }} onClick={() => setShowPaymentModal(true)}>
                                            <PiPlus className="mr-2" /> Record Payment
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Total Sales</p>
                                            <p className="text-lg font-black text-gray-800">SAR {totalSalesRec.toLocaleString()}</p>
                                            <p className="text-[9px] text-gray-400">{agentLedger.length} bookings</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase">Total Paid</p>
                                            <p className="text-lg font-black text-emerald-600">SAR {totalPaymentsRec.toLocaleString()}</p>
                                            <p className="text-[9px] text-emerald-400">{agentPayments.length} payments</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                                            <p className="text-[10px] font-black text-red-400 uppercase">Balance Due</p>
                                            <p className={`text-lg font-black ${dynamicDues > 0 ? 'text-red-600' : 'text-emerald-600'}`}>SAR {dynamicDues.toLocaleString()}</p>
                                            <p className="text-[9px] text-red-400">{dynamicDues > 0 ? 'Outstanding' : 'Settled'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 max-h-[600px] overflow-y-auto border-t border-gray-100 pt-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase sticky top-0 bg-white py-2 z-10">Transaction Ledger</p>
                                        {loadingLedger ? (
                                            <div className="flex justify-center p-8"><PiClock className="animate-spin h-8 w-8 text-gray-200" /></div>
                                        ) : sortedTransactions && sortedTransactions.length > 0 ? (
                                            <div className="space-y-2">
                                                {sortedTransactions.map((item: any) => (
                                                    <div key={`${item.itemType}-${item.id}`} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.itemType === 'BOOKING' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                {item.itemType === 'BOOKING' ? <PiReceipt /> : <PiBank />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">
                                                                    {item.itemType === 'BOOKING' ? `${item.passengerName || 'Unknown Passenger'} - ${item.airline || 'N/A'} (${item.sector || 'N/A'})` : (item.type === 'DUES' ? 'Credit Note / Manual Dues' : 'Payment Received')}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400">
                                                                    {(() => {
                                                                        try {
                                                                            const dateObj = item.createdAt ? new Date(item.createdAt) : null;
                                                                            if (dateObj && !isNaN(dateObj.getTime())) {
                                                                                return format(dateObj, 'dd MMM yyyy');
                                                                            }
                                                                            return 'Invalid Date';
                                                                        } catch (e) {
                                                                            console.warn('Date format error:', item.createdAt);
                                                                            return 'Invalid Date';
                                                                        }
                                                                    })()} |
                                                                    {item.itemType === 'BOOKING'
                                                                        ? (() => {
                                                                            try {
                                                                                if (item.travelDate) {
                                                                                    const travelDate = new Date(item.travelDate);
                                                                                    if (!isNaN(travelDate.getTime())) {
                                                                                        return ` ${item.pnr || 'NO PNR'} | Travel: ${format(travelDate, 'dd MMM')}`;
                                                                                    }
                                                                                }
                                                                                return ` ${item.pnr || 'NO PNR'} | Travel: N/A`;
                                                                            } catch (e) {
                                                                                console.warn('Travel date format error:', item.travelDate);
                                                                                return ` ${item.pnr || 'NO PNR'} | Travel: N/A`;
                                                                            }
                                                                        })()
                                                                        : (item.reference || 'No Ref')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-sm font-black ${item.itemType === 'BOOKING' ? 'text-gray-900' : 'text-emerald-600'}`}>
                                                                {item.itemType === 'BOOKING'
                                                                    ? `+ SAR ${(item.sellingPrice && !isNaN(item.sellingPrice) ? item.sellingPrice : 0).toLocaleString()}`
                                                                    : `- SAR ${(item.amount && !isNaN(item.amount) ? item.amount : 0).toLocaleString()}`}
                                                            </p>
                                                            {item.itemType === 'PAYMENT' && (
                                                                <button 
                                                                    onClick={() => {
                                                                        setSelectedPayment(item);
                                                                        setShowDeleteModal(true);
                                                                    }} 
                                                                    className="text-[10px] text-red-400 hover:underline flex items-center justify-end gap-1 ml-auto"
                                                                    disabled={deletingId === item.id}
                                                                >
                                                                    {deletingId === item.id ? <PiClock className="animate-spin" /> : null}
                                                                    {deletingId === item.id ? "Deleting..." : "Delete Record"}
                                                                </button>
                                                            )}
                                                            {item.itemType === 'BOOKING' && (
                                                                <Badge variant="outline" className={`text-[8px] h-4 ${item.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                                    {item.paymentStatus}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                <PiFileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm font-medium">No transactions yet</p>
                                                <p className="text-xs">Bookings and payments will appear here</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card className="border-gray-200 shadow-none rounded-2xl border-dashed h-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
                            <PiFileText className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-bold">Select an agent to view their financial statement and record payments.</p>
                        </Card>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Record Transaction</DialogTitle>
                        <DialogDescription>Record a payment or add manual dues for {selectedAgent?.name}.</DialogDescription>
                    </DialogHeader>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 py-4"
                    >
                        <div className="grid gap-2">
                            <Label>Transaction Type</Label>
                            <select 
                                className="w-full h-11 border border-gray-200 rounded-xl px-3 outline-none focus:ring-2 focus:ring-purple-200"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="PAYMENT">Payment Received (Cash/Bank)</option>
                                <option value="DUES">Add Manual Dues (Increase Balance)</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Amount (SAR)</Label>
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
                    </motion.div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                        <Button 
                            style={{ backgroundColor: B.primary }} 
                            className="text-white px-8" 
                            onClick={handleRecordPayment}
                            disabled={savingRecord}
                        >
                            {savingRecord ? <PiClock className="animate-spin mr-2" /> : null}
                            {savingRecord ? "Processing..." : "Save Record"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION MODAL */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-red-600 flex items-center gap-2">
                            <PiTrash className="h-5 w-5" /> Delete Payment Record
                        </DialogTitle>
                    </DialogHeader>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-4 space-y-3"
                    >
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-3">
                            <PiWarning className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">
                                This action will revert approximately **SAR {selectedPayment?.amount?.toLocaleString()}** worth of bookings back to **UNPAID**.
                            </p>
                        </div>
                        <p className="text-sm text-gray-600">
                            Are you sure you want to permanently remove this transaction from the ledger?
                        </p>
                    </motion.div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            className="rounded-xl font-bold" 
                            onClick={handleDeletePayment}
                            disabled={!!deletingId}
                        >
                            {deletingId ? <PiClock className="animate-spin mr-2" /> : null}
                            {deletingId ? "Deleting..." : "Delete Record"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
