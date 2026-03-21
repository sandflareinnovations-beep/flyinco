"use client";
import { 
    PiUsers, 
    PiCurrencyDollar, 
    PiBriefcase, 
    PiPlus, 
    PiReceipt, 
    PiBank, 
    PiTrash,
    PiFileText,
    PiDownloadSimple,
    PiMagnifyingGlass,
    PiCaretRight,
    PiClock
} from "react-icons/pi";
import { useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

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
    const [loadingLedger, setLoadingLedger] = useState(false);
    const [formData, setFormData] = useState({ amount: "", type: "PAYMENT", reference: "", notes: "" });
    const { toast } = useToast();

    const fetchAgents = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await flyApi.users.list({ limit: 1000 });
            console.log("FETCHED AGENTS RAW:", data);
            const list = Array.isArray(data) ? data : (data.users || []);
            const agentList = list.filter((u: any) => u.role === 'AGENT');
            console.log("FILTERED AGENTS:", agentList);
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
        setLoadingLedger(true);
        try {
            const [bookingsRes, paymentsRes] = await Promise.all([
                flyApi.bookings.list({ limit: 1000, agent: agent.name || agent.agencyName }),
                flyApi.payments.byAgent(agent.id)
            ]);
            
            const bookings = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes.bookings || []);
            setAgentLedger(bookings);
            setAgentPayments(paymentsRes);
        } catch (error: any) {
            toast({ title: "Error fetching ledger", description: error.message, variant: "destructive" });
        } finally { setLoadingLedger(false); }
    };

    const handleRecordPayment = async () => {
        if (!selectedAgent || !formData.amount) return;
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
            fetchLedger(selectedAgent);
            fetchAgents();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDeletePayment = async (id: string) => {
        if (!confirm("Are you sure you want to delete this payment record? This will revert associated bookings to UNPAID status.")) return;
        try {
            await flyApi.payments.delete(id);
            toast({ title: "Deleted", description: "Payment record removed." });
            fetchLedger(selectedAgent);
            fetchAgents();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleExportExcel = () => {
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

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ledger");
        XLSX.writeFile(wb, `${selectedAgent.name}_Reports.xlsx`);
    };

    const totalSalesRec = useMemo(() => agentLedger.reduce((sum, b) => sum + (b.sellingPrice || 0), 0), [agentLedger]);
    const totalPaymentsRec = useMemo(() => agentPayments.reduce((sum, p) => sum + (p.amount || 0), 0), [agentPayments]);
    const dynamicDues = totalSalesRec - totalPaymentsRec;

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
                                <TableRow key={agent.id} className={selectedAgent?.id === agent.id ? "bg-purple-50" : "hover:bg-gray-50 transition-colors"}>
                                    <TableCell>
                                        <p className="font-bold text-gray-800 tracking-tight">{agent.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase">{agent.agencyName || 'INDIVIDUAL AGENT'}</p>
                                    </TableCell>
                                    <TableCell className="text-right font-black text-red-600">
                                        SAR {(agent.pendingDues || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="rounded-md hover:bg-white hover:shadow-sm" onClick={() => fetchLedger(agent)}>
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
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Total Sales</p>
                                            <p className="text-lg font-black text-gray-800">SAR {totalSalesRec.toLocaleString()}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                                            <p className="text-[10px] font-black text-red-400 uppercase">Total Dues</p>
                                            <p className="text-lg font-black text-red-600">SAR {dynamicDues.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                        <p className="text-[10px] font-black text-gray-400 uppercase sticky top-0 bg-white py-2">Transaction Ledger</p>
                                        {loadingLedger ? (
                                            <div className="flex justify-center p-8"><PiClock className="animate-spin h-8 w-8 text-gray-200" /></div>
                                        ) : (
                                            <div className="space-y-2">
                                                {/* Combine bookings and payments */}
                                                {[
                                                    ...agentLedger.map(b => ({ ...b, itemType: 'BOOKING' })),
                                                    ...agentPayments.map(p => ({ ...p, itemType: 'PAYMENT' }))
                                                ].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((item: any) => (
                                                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.itemType === 'BOOKING' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                {item.itemType === 'BOOKING' ? <PiReceipt /> : <PiBank />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">
                                                                    {item.itemType === 'BOOKING' ? `${item.passengerName} - ${item.airline || ''} (${item.sector || ''})` : (item.type === 'DUES' ? 'Credit Note / Manual Dues' : 'Payment Received')}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400">
                                                                    {format(new Date(item.createdAt), 'dd MMM yyyy')} | 
                                                                    {item.itemType === 'BOOKING' 
                                                                        ? `${item.pnr || 'NO PNR'} | Travel: ${item.travelDate ? format(new Date(item.travelDate), 'dd MMM') : 'N/A'}` 
                                                                        : (item.reference || 'No Ref')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-sm font-black ${item.itemType === 'BOOKING' ? 'text-gray-900' : 'text-emerald-600'}`}>
                                                                {item.itemType === 'BOOKING' ? `+ SAR ${item.sellingPrice?.toLocaleString() || 0}` : `- SAR ${item.amount?.toLocaleString() || 0}`}
                                                            </p>
                                                            {item.itemType === 'PAYMENT' && (
                                                                <button onClick={() => handleDeletePayment(item.id)} className="text-[10px] text-red-400 hover:underline">Delete Record</button>
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
                    <div className="space-y-4 py-4">
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
