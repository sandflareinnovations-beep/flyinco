"use client";
import { PiReceipt, PiPlus, PiPrinter, PiDownloadSimple, PiMagnifyingGlass, PiTrash, PiEye } from "react-icons/pi";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { InvoiceModal } from "@/components/admin/invoice-modal";
import { flyApi } from "@/lib/api";
import { format } from "date-fns";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export default function AdminInvoicesPage() {
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [search, setSearch] = useState("");
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const { toast } = useToast();

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const data = await flyApi.invoices.list({ page: 1, limit: 100, search });
            setInvoices(data.invoices || []);
        } catch (err: any) {
            console.error("Error fetching invoices:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [search]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this receipt?")) return;
        try {
            await flyApi.invoices.delete(id);
            toast({ title: "Receipt Deleted" });
            fetchInvoices();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Receipts</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Create and manage customer receipts.</p>
                </div>
                <Button
                    className="rounded-xl gap-2 font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #2E0A57, #6C2BD9)" }}
                    onClick={() => setShowInvoiceModal(true)}
                >
                    <PiPlus className="h-4 w-4" /> Create Receipt
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search receipts..."
                        className="pl-9 rounded-xl border-gray-200"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Invoice List */}
            {loading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #2E0A57, #6C2BD9)" }}>
                        <PiReceipt className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">No Receipts Yet</h2>
                    <p className="text-gray-400 text-sm mt-1 mb-4">Create your first receipt to get started.</p>
                    <Button
                        className="rounded-xl gap-2 font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #2E0A57, #6C2BD9)" }}
                        onClick={() => setShowInvoiceModal(true)}
                    >
                        <PiPlus className="h-4 w-4" /> Create Receipt
                    </Button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase">Receipt #</th>
                                <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase">Customer</th>
                                <th className="text-right px-4 py-3 text-xs font-black text-gray-500 uppercase">Amount</th>
                                <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase">Date</th>
                                <th className="text-right px-4 py-3 text-xs font-black text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <span className="font-semibold text-sm">{inv.invoiceNumber}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium">{inv.customerName}</p>
                                        <p className="text-xs text-gray-400">{inv.customerEmail}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-bold text-violet-600">SAR {inv.total?.toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-500">
                                            {inv.createdAt ? format(new Date(inv.createdAt), 'dd MMM yyyy') : '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(inv)} className="h-8 w-8 p-0">
                                                <PiEye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(inv.id)} className="h-8 w-8 p-0 text-red-500">
                                                <PiTrash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Invoice Modal */}
            {showInvoiceModal && (
                <InvoiceModal onClose={() => { setShowInvoiceModal(false); fetchInvoices(); }} />
            )}

            {/* View Invoice Dialog */}
            <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Receipt {selectedInvoice?.invoiceNumber}</DialogTitle>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400">Customer</p>
                                    <p className="font-semibold">{selectedInvoice.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Date</p>
                                    <p className="font-semibold">{selectedInvoice.createdAt ? format(new Date(selectedInvoice.createdAt), 'dd MMM yyyy') : '-'}</p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <p className="text-xs text-gray-400 mb-2">Items</p>
                                <div className="space-y-2">
                                    {Array.isArray(selectedInvoice.items) && selectedInvoice.items.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span>{item.description} × {item.quantity}</span>
                                            <span className="font-medium">SAR {item.total?.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t pt-4 flex justify-between">
                                <span className="font-bold">Total</span>
                                <span className="font-black text-violet-600 text-xl">SAR {selectedInvoice.total?.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
