"use client";
import { PiReceipt, PiPlus, PiPrinter, PiDownloadSimple, PiMagnifyingGlass, PiTrash } from "react-icons/pi";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { InvoiceModal } from "@/components/admin/invoice-modal";

export default function AdminInvoicesPage() {
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [search, setSearch] = useState("");
    const { toast } = useToast();

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Invoices</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Create and manage customer invoices.</p>
                </div>
                <Button
                    className="rounded-xl gap-2 font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #2E0A57, #6C2BD9)" }}
                    onClick={() => setShowInvoiceModal(true)}
                >
                    <PiPlus className="h-4 w-4" /> Create Invoice
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search invoices..."
                        className="pl-9 rounded-xl border-gray-200"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Empty State */}
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #2E0A57, #6C2BD9)" }}>
                    <PiReceipt className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">No Invoices Yet</h2>
                <p className="text-gray-400 text-sm mt-1 mb-4">Create your first invoice to get started.</p>
                <Button
                    className="rounded-xl gap-2 font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #2E0A57, #6C2BD9)" }}
                    onClick={() => setShowInvoiceModal(true)}
                >
                    <PiPlus className="h-4 w-4" /> Create Invoice
                </Button>
            </div>

            {/* Invoice Modal */}
            {showInvoiceModal && (
                <InvoiceModal onClose={() => setShowInvoiceModal(false)} />
            )}
        </div>
    );
}
