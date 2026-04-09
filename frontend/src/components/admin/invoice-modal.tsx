"use client";
import { PiPrinter, PiDownloadSimple, PiX, PiReceipt, PiFloppyDisk } from "react-icons/pi";
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { flyApi } from "@/lib/api";

interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface InvoiceProps {
    onClose: () => void;
    customerData?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    bookingData?: any;
    initialItems?: InvoiceItem[];
}

export function InvoiceModal({ onClose, customerData, bookingData, initialItems }: InvoiceProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
        date: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        customerName: customerData?.name || '',
        customerEmail: customerData?.email || '',
        customerPhone: customerData?.phone || '',
    });

    const [items, setItems] = useState<InvoiceItem[]>(
        initialItems && initialItems.length > 0
            ? initialItems
            : [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]
    );
    
    const [notes, setNotes] = useState('');
    const [vatRate, setVatRate] = useState(15);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const { toast } = useToast();

    const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
        }
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    const handleSave = async () => {
        setSaving(true);
        try {
            await flyApi.invoices.create({
                invoiceNumber: invoiceData.invoiceNumber,
                customerName: invoiceData.customerName,
                customerEmail: invoiceData.customerEmail,
                customerPhone: invoiceData.customerPhone,
                items: items.filter(i => i.description),
                subtotal,
                vatRate,
                vatAmount,
                total,
                notes,
            });
            setSaved(true);
            toast({ title: "Receipt Saved", description: `Receipt ${invoiceData.invoiceNumber} saved successfully.` });
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to save invoice", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '', 'width=800,height=900');
        if (!printWindow) return;

        printWindow.document.write('<html><head><title>Receipt - ' + invoiceData.invoiceNumber + '</title>');
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            @media print { .no-print { display: none; } body { padding: 0; margin: 0; } }
            body { font-family: 'Inter', sans-serif; }
        `);
        printWindow.document.write('</style></head><body class="bg-white">');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 800);
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PiReceipt className="h-5 w-5 text-violet-600" />
                        Create Receipt
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Create a professional receipt for the customer.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col md:flex-row gap-6 py-4 max-h-[70vh] overflow-y-auto">
                    {/* Left: Form */}
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-semibold">Invoice Number</Label>
                                <Input value={invoiceData.invoiceNumber} onChange={e => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})} className="h-8 text-sm" />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold">Date</Label>
                                <Input type="date" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} className="h-8 text-sm" />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <Label className="text-xs font-semibold text-gray-500 uppercase">Customer Details</Label>
                            <div className="grid grid-cols-1 gap-2 mt-2">
                                <Input placeholder="Customer Name" value={invoiceData.customerName} onChange={e => setInvoiceData({...invoiceData, customerName: e.target.value})} className="h-9" />
                                <Input placeholder="Email" type="email" value={invoiceData.customerEmail} onChange={e => setInvoiceData({...invoiceData, customerEmail: e.target.value})} className="h-9" />
                                <Input placeholder="Phone" value={invoiceData.customerPhone} onChange={e => setInvoiceData({...invoiceData, customerPhone: e.target.value})} className="h-9" />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <Label className="text-xs font-semibold text-gray-500 uppercase">Line Items</Label>
                            <div className="space-y-2 mt-2">
                                {items.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <Input 
                                            placeholder="Description" 
                                            value={item.description} 
                                            onChange={e => updateItem(index, 'description', e.target.value)}
                                            className="flex-1 h-9 text-sm"
                                        />
                                        <Input 
                                            type="number"
                                            placeholder="Qty" 
                                            value={item.quantity || ''} 
                                            onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                            className="w-16 h-9 text-sm"
                                        />
                                        <Input 
                                            type="number"
                                            placeholder="Price" 
                                            value={item.unitPrice || ''} 
                                            onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            className="w-24 h-9 text-sm"
                                        />
                                        <span className="w-24 text-sm font-medium text-right">
                                            SAR {item.total.toLocaleString()}
                                        </span>
                                        <Button variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-500 h-9 px-2">
                                            ×
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={addItem} className="text-xs">
                                    + Add Item
                                </Button>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center gap-4">
                                <div>
                                    <Label className="text-xs font-semibold">VAT Rate (%)</Label>
                                    <Input 
                                        type="number" 
                                        value={vatRate} 
                                        onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
                                        className="h-9 w-24 mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <Label className="text-xs font-semibold">Notes</Label>
                            <Input placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)} className="h-9 mt-1" />
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="flex-1">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div ref={printRef} className="bg-white p-6 rounded-lg">
                                {/* Invoice Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <img src="/logo.png" alt="Flyinco" className="h-12 object-contain mb-2" />
                                        <p className="text-xs text-gray-500">Al Moosa Center Tower 3, Olaya St<br/>Riyadh 12212, Saudi Arabia</p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-xl font-black text-gray-900">RECEIPT</h2>
                                        <p className="text-sm text-gray-500">#{invoiceData.invoiceNumber}</p>
                                        <p className="text-xs text-gray-400 mt-1">Date: {invoiceData.date}</p>
                                    </div>
                                </div>

                                {/* Customer */}
                                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Bill To</p>
                                    <p className="font-semibold text-gray-900">{invoiceData.customerName || 'Customer Name'}</p>
                                    <p className="text-sm text-gray-500">{invoiceData.customerEmail}</p>
                                    <p className="text-sm text-gray-500">{invoiceData.customerPhone}</p>
                                </div>

                                {/* Items Table */}
                                <table className="w-full text-sm mb-4">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="text-left py-2 text-[10px] text-gray-500 uppercase">Description</th>
                                            <th className="text-center py-2 text-[10px] text-gray-500 uppercase">Qty</th>
                                            <th className="text-right py-2 text-[10px] text-gray-500 uppercase">Unit Price</th>
                                            <th className="text-right py-2 text-[10px] text-gray-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.filter(i => i.description).map((item, i) => (
                                            <tr key={i} className="border-b border-gray-100">
                                                <td className="py-2">{item.description}</td>
                                                <td className="text-center py-2">{item.quantity}</td>
                                                <td className="text-right py-2">SAR {item.unitPrice.toLocaleString()}</td>
                                                <td className="text-right py-2 font-medium">SAR {item.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Totals */}
                                <div className="border-t pt-3 space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-medium">SAR {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">VAT ({vatRate}%)</span>
                                        <span className="font-medium">SAR {vatAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-black text-violet-700 pt-2 border-t">
                                        <span>Total</span>
                                        <span>SAR {total.toLocaleString()}</span>
                                    </div>
                                </div>

                                {notes && (
                                    <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Notes</p>
                                        <p className="text-sm text-gray-600">{notes}</p>
                                    </div>
                                )}

                                <div className="mt-6 text-center text-xs text-gray-400">
                                    <p>Thank you for choosing Flyinco Travel and Tourism!</p>
                                    <p>Phone: 055 618 2021 | Email: info@flyinco.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
                    <Button variant="outline" onClick={handleSave} disabled={saving || saved} className="rounded-xl gap-2">
                        <PiFloppyDisk className="h-4 w-4" /> {saving ? 'Saving...' : saved ? 'Saved' : 'Save Receipt'}
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="rounded-xl gap-2">
                        <PiPrinter className="h-4 w-4" /> Print / PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
