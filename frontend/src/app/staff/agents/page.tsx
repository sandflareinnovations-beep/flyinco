"use client";
import { PiUserCircle, PiMagnifyingGlass, PiEye, PiBookOpen, PiMoney, PiClock, PiCheckCircle, PiReceipt } from "react-icons/pi";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { flyApi, fetchWithCreds } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { InvoiceModal } from "@/components/admin/invoice-modal";

export default function StaffAgentsPage() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [agentBookings, setAgentBookings] = useState<any[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const { toast } = useToast();

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const data = await flyApi.users.list({ limit: 1000 });
            const list = Array.isArray(data) ? data : (data.users || []);
            setAgents(list.filter((u: any) => u.role === "AGENT"));
        } catch (err: any) {
            console.error(err);
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAgents(); }, []);

    const fetchAgentBookings = async (agentId: string) => {
        setLoadingBookings(true);
        try {
            const data = await flyApi.bookings.listPaginated({ page: 1, limit: 100, agentId });
            setAgentBookings(data.bookings || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoadingBookings(false);
        }
    };

    const openAgentDetails = (agent: any) => {
        setSelectedAgent(agent);
        fetchAgentBookings(agent.id);
    };

    const handleIssueInvoice = () => {
        if (!selectedAgent) return;
        setShowInvoiceModal(true);
    };

    const filteredAgents = agents.filter(a => 
        a.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.agencyName?.toLowerCase().includes(search.toLowerCase()) ||
        a.email?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch(status) {
            case "CONFIRMED": return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Confirmed</Badge>;
            case "HELD": return <Badge className="bg-violet-50 text-violet-700 border-violet-200">Held</Badge>;
            case "CANCELLED": return <Badge className="bg-red-50 text-red-600 border-red-200">Cancelled</Badge>;
            default: return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900">Agents</h1>
                <p className="text-gray-400 text-sm mt-0.5">View all agents and their booking activity.</p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search agents..."
                        className="pl-9 rounded-xl border-gray-200"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Agents List */}
            {loading ? (
                <div className="text-center py-8 text-gray-400">Loading agents...</div>
            ) : filteredAgents.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <PiUserCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-gray-900">No Agents Found</h2>
                    <p className="text-gray-400 text-sm mt-1">No agents match your search.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Agent</TableHead>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Agency</TableHead>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Contact</TableHead>
                                <TableHead className="text-right text-xs font-black text-gray-500 uppercase">Total Sales</TableHead>
                                <TableHead className="text-right text-xs font-black text-gray-500 uppercase">Pending Dues</TableHead>
                                <TableHead className="text-right text-xs font-black text-gray-500 uppercase">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAgents.map((agent) => (
                                <TableRow key={agent.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <span className="text-xs font-bold text-emerald-600">{agent.name?.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900">{agent.name}</p>
                                                <p className="text-xs text-gray-400">{agent.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-700">{agent.agencyName || '-'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-600">{agent.phone || '-'}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm font-bold text-emerald-600">SAR {agent.totalSales?.toLocaleString() || 0}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm font-bold text-red-500">SAR {agent.pendingDues?.toLocaleString() || 0}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => openAgentDetails(agent)} className="rounded-xl gap-1">
                                            <PiEye className="h-4 w-4" /> View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Agent Details Dialog */}
            <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
                <DialogContent className="max-w-3xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PiUserCircle className="h-5 w-5 text-emerald-600" />
                            {selectedAgent?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedAgent && (
                        <div className="space-y-4">
                            {/* Agent Info Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <Card className="border-gray-100">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold text-gray-500 uppercase">Total Sales</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xl font-black text-emerald-600">SAR {selectedAgent.totalSales?.toLocaleString() || 0}</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-gray-100">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold text-gray-500 uppercase">Pending Dues</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xl font-black text-red-500">SAR {selectedAgent.pendingDues?.toLocaleString() || 0}</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-gray-100">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold text-gray-500 uppercase">Total Paid</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xl font-black text-violet-600">SAR {selectedAgent.totalPaid?.toLocaleString() || 0}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Bookings */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <PiBookOpen className="h-4 w-4" /> Recent Bookings
                                </h4>
                                {loadingBookings ? (
                                    <p className="text-sm text-gray-400">Loading bookings...</p>
                                ) : agentBookings.length === 0 ? (
                                    <p className="text-sm text-gray-400">No bookings found.</p>
                                ) : (
                                    <div className="max-h-[300px] overflow-y-auto border rounded-xl">
                                        <Table>
                                            <TableHeader className="bg-gray-50 sticky top-0">
                                                <TableRow>
                                                    <TableHead className="text-xs">Passenger</TableHead>
                                                    <TableHead className="text-xs">Route</TableHead>
                                                    <TableHead className="text-xs">Price</TableHead>
                                                    <TableHead className="text-xs">Status</TableHead>
                                                    <TableHead className="text-xs">Payment</TableHead>
                                                    <TableHead className="text-xs">Date</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {agentBookings.slice(0, 10).map((booking: any) => (
                                                    <TableRow key={booking.id}>
                                                        <TableCell className="text-xs">{booking.passengerName}</TableCell>
                                                        <TableCell className="text-xs">{booking.route?.origin} → {booking.route?.destination}</TableCell>
                                                        <TableCell className="text-xs font-medium">SAR {booking.sellingPrice?.toLocaleString()}</TableCell>
                                                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`text-[10px] font-bold ${
                                                                booking.paymentStatus === "PAID"
                                                                    ? "text-emerald-600 border-emerald-200"
                                                                    : "text-red-600 border-red-200"
                                                            }`}>
                                                                {booking.paymentStatus || 'UNPAID'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {booking.createdAt ? format(new Date(booking.createdAt), 'dd MMM') : '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>

                            {/* Unpaid Bookings Summary & Issue Invoice */}
                            {agentBookings.some((b: any) => b.paymentStatus !== "PAID") && (
                                <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            {agentBookings.filter((b: any) => b.paymentStatus !== "PAID").length} unpaid booking(s) totaling{' '}
                                            <span className="font-bold text-red-600">
                                                SAR {agentBookings
                                                    .filter((b: any) => b.paymentStatus !== "PAID")
                                                    .reduce((sum: number, b: any) => sum + (b.sellingPrice || 0), 0)
                                                    .toLocaleString()}
                                            </span>
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleIssueInvoice}
                                        className="rounded-xl gap-2 font-semibold text-white bg-violet-600 hover:bg-violet-700"
                                    >
                                        <PiReceipt className="h-4 w-4" /> Issue Receipt
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Invoice Modal */}
            {showInvoiceModal && selectedAgent && (
                <InvoiceModal
                    onClose={() => setShowInvoiceModal(false)}
                    customerData={{
                        name: selectedAgent.name,
                        email: selectedAgent.email,
                        phone: selectedAgent.phone,
                    }}
                    initialItems={agentBookings
                        .filter((b: any) => b.paymentStatus !== "PAID")
                        .map((b: any) => ({
                            description: `${b.passengerName} - ${b.route?.origin || '?'} → ${b.route?.destination || '?'} (${b.pnr || 'No PNR'})`,
                            quantity: 1,
                            unitPrice: b.sellingPrice || 0,
                            total: b.sellingPrice || 0,
                        }))}
                />
            )}
        </div>
    );
}
