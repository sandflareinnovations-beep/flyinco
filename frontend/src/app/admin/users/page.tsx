"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Users, Mail, Phone, Calendar, Plus, KeyRound, Trash2, ShieldCheck, User, AlertTriangle, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { flyApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const B = { primary: "#2E0A57", accent: "#6C2BD9" };

type ModalType = "addUser" | "changePassword" | "deleteUser" | "manageFinances" | null;

export default function UsersAdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState<ModalType>(null);
    const [selected, setSelected] = useState<any>(null);
    const [form, setForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await flyApi.users.list();
            setUsers(data);
        } catch (error: any) {
            toast({ title: "Error fetching users", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const openModal = (type: ModalType, user?: any) => {
        setModal(type);
        setSelected(user || null);
        setForm(type === "addUser" ? { role: "USER" } : {});
    };
    const closeModal = () => { setModal(null); setSelected(null); setForm({}); };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await flyApi.users.create({
                ...form,
                creditLimit: form.creditLimit ? Number(form.creditLimit) : 0
            });
            toast({ title: "User Added", description: `${form.name} has been created.` });
            fetchUsers();
            closeModal();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally { setSaving(false); }
    };

    const handleFinance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        setSaving(true);
        try {
            await flyApi.payments.create({
                agentId: selected.id,
                amount: Number(form.amount || 0),
                type: form.paymentType || "PAYMENT", // "PAYMENT" or "DUES"
                status: "COMPLETED",
                reference: form.reference || ""
            });
            toast({ title: "Finance Updated", description: `Transaction recorded for ${selected.name}.` });
            fetchUsers();
            closeModal();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally { setSaving(false); }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        if (!form.newPassword || form.newPassword.length < 6) {
            toast({ title: "Validation", description: "Password must be at least 6 characters.", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            await flyApi.users.changePassword(selected.id, form.newPassword);
            toast({ title: "Password Changed", description: `Password updated for ${selected.name}.` });
            closeModal();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally { setSaving(false); }
    };

    const handleDeleteUser = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await flyApi.users.delete(selected.id);
            toast({ title: "User Deleted", description: `${selected.name} has been removed.` });
            fetchUsers();
            closeModal();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally { setSaving(false); }
    };

    const handleDownloadAgentReport = async (agent: any) => {
        setIsLoading(true);
        try {
            const bookings = await flyApi.bookings.list();
            const agentBookings = bookings.filter((b: any) => {
                if (b.userId === agent.id) return true;
                const agentDetailsStr = b.agentDetails?.toLowerCase() || '';
                if (agent.name && agentDetailsStr.includes(agent.name.toLowerCase())) return true;
                if (agent.agencyName && agentDetailsStr.includes(agent.agencyName.toLowerCase())) return true;
                return false;
            });

            const dataToExport = agentBookings.map((b: any) => ({
                "Booking ID": b.id,
                "Date": new Date(b.createdAt).toLocaleDateString(),
                "Passenger": b.passengerName,
                "Passport": b.passportNumber,
                "Route": b.route || "N/A",
                "Sale Price": b.sellingPrice,
                "Agent Cost": b.purchasePrice,
                "Payment Status": b.paymentStatus || 'UNPAID',
                "Booking Status": b.status
            }));

            const paidAmt = agentBookings.filter((b: any) => b.paymentStatus === 'PAID').reduce((s: number, b: any) => s + (b.purchasePrice || 0), 0);
            const unpaidAmt = agentBookings.filter((b: any) => (b.paymentStatus || 'UNPAID') === 'UNPAID').reduce((s: number, b: any) => s + (b.purchasePrice || 0), 0);
            
            dataToExport.push({
                "Booking ID": "TOTALS",
                "Date": "",
                "Passenger": "",
                "Passport": "",
                "Route": "",
                "Sale Price": agentBookings.reduce((s: number, b: any) => s + (b.sellingPrice || 0), 0),
                "Agent Cost": agentBookings.reduce((s: number, b: any) => s + (b.purchasePrice || 0), 0),
                "Payment Status": `Unpaid: ${unpaidAmt} | Paid: ${paidAmt}`,
                "Booking Status": ""
            });

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Agent Accounts");
            
            XLSX.writeFile(wb, `${agent.name || 'Agent'}_Accounts_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast({ title: "Export Complete", description: "The Excel file is downloading." });
        } catch(e) {
            toast({ title: "Export Failed", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">User Management</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Manage users, roles, and credentials.</p>
                </div>
                <Button
                    className="rounded-xl gap-2 font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${B.primary}, ${B.accent})` }}
                    onClick={() => openModal("addUser")}
                >
                    <Plus className="h-4 w-4" /> Add User
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { label: "Total Users", value: users.length, color: B.primary },
                    { label: "Agents", value: users.filter(u => u.role === "AGENT").length, color: "#10B981" },
                    { label: "Customers", value: users.filter(u => u.role === "USER").length, color: "#64748B" },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{stat.label}</p>
                        <p className="text-3xl font-black mt-1" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 border-gray-100">
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">User</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Role</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Finances</TableHead>
                            <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5}>
                                        <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-gray-400">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : users.map((user, i) => (
                            <motion.tr
                                key={user.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.04 }}
                                className="hover:bg-gray-50 border-gray-100 transition-colors"
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                                            style={{ background: user.role === "ADMIN" ? `linear-gradient(135deg, ${B.primary}, ${B.accent})` : "#E5E7EB", color: user.role === "ADMIN" ? "#fff" : "#6B7280" }}>
                                            {user.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-400 font-mono">{user.id.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <Mail className="h-3 w-3 text-gray-400" />{user.email}
                                        </div>
                                        {user.phone && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <Phone className="h-3 w-3" />{user.phone}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {user.role === "ADMIN" ? (
                                        <Badge className="bg-violet-50 text-violet-700 border-violet-200 gap-1 font-semibold" variant="outline">
                                            <ShieldCheck className="h-3 w-3" /> Admin
                                        </Badge>
                                    ) : user.role === "AGENT" ? (
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-semibold" variant="outline">
                                            <User className="h-3 w-3" /> Agent
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-gray-50 text-gray-600 border-gray-200 gap-1 font-semibold" variant="outline">
                                            <User className="h-3 w-3" /> User
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {user.role === "AGENT" ? (
                                        <div className="flex flex-col gap-0.5 text-xs">
                                            <span className="text-violet-600 font-black">Sales: ₹{user.totalSales?.toLocaleString() || 0}</span>
                                            <span className="text-red-500 font-bold">Unpaid: ₹{user.pendingDues?.toLocaleString() || 0}</span>
                                            <span className="text-emerald-600 font-bold">Paid: ₹{user.totalPaid?.toLocaleString() || 0}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">N/A</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {user.role === "AGENT" && (
                                            <>
                                                <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-1.5 text-xs text-blue-600 hover:bg-blue-50"
                                                    onClick={() => handleDownloadAgentReport(user)}>
                                                    <Download className="h-3.5 w-3.5" /> Export
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-1.5 text-xs text-emerald-600 hover:bg-emerald-50"
                                                    onClick={() => openModal("manageFinances", user)}>
                                                    Finances
                                                </Button>
                                            </>
                                        )}
                                        <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-1.5 text-xs text-violet-600 hover:bg-violet-50"
                                            onClick={() => openModal("changePassword", user)}>
                                            <KeyRound className="h-3.5 w-3.5" /> Password
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-1.5 text-xs text-red-500 hover:bg-red-50"
                                            onClick={() => openModal("deleteUser", user)}>
                                            <Trash2 className="h-3.5 w-3.5" /> Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            </motion.tr>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* ─── ADD USER MODAL ─── */}
            <Dialog open={modal === "addUser"} onOpenChange={() => closeModal()}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black flex items-center gap-2">
                            <Plus className="h-5 w-5 text-violet-600" /> Add New User
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddUser}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Full Name *</Label>
                                <Input className="rounded-xl" placeholder="John Doe" required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Email *</Label>
                                <Input className="rounded-xl" type="email" placeholder="john@example.com" required value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Phone</Label>
                                <Input className="rounded-xl" placeholder="+966 5xx xxx xxxx" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Password *</Label>
                                <Input className="rounded-xl" type="password" placeholder="Min 6 characters" required value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Role</Label>
                                <select className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                    value={form.role || "USER"} onChange={e => setForm({ ...form, role: e.target.value })}>
                                    <option value="USER">Customer / User</option>
                                    <option value="AGENT">Agent</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            {form.role === "AGENT" && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">Agency Name</Label>
                                        <Input className="rounded-xl" placeholder="Agency XYZ" value={form.agencyName || ""} onChange={e => setForm({ ...form, agencyName: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">Credit Limit (₹)</Label>
                                        <Input className="rounded-xl" type="number" placeholder="50000" value={form.creditLimit || ""} onChange={e => setForm({ ...form, creditLimit: e.target.value })} />
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" disabled={saving} className="rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${B.primary}, ${B.accent})` }}>
                                {saving ? "Adding..." : "Add User"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── CHANGE PASSWORD MODAL ─── */}
            <Dialog open={modal === "changePassword"} onOpenChange={() => closeModal()}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-violet-600" /> Change Password
                        </DialogTitle>
                        <p className="text-sm text-gray-400">{selected?.name} · {selected?.email}</p>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword}>
                        <div className="space-y-3 py-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">New Password *</Label>
                                <Input className="rounded-xl" type="password" placeholder="Min 6 characters" required value={form.newPassword || ""} onChange={e => setForm({ ...form, newPassword: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Confirm Password *</Label>
                                <Input className="rounded-xl" type="password" placeholder="Repeat password" required value={form.confirmPassword || ""} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
                                {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" /> Passwords do not match
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" disabled={saving || (form.confirmPassword && form.newPassword !== form.confirmPassword)} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
                                {saving ? "Saving..." : "Update Password"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── DELETE USER MODAL ─── */}
            <Dialog open={modal === "deleteUser"} onOpenChange={() => closeModal()}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-red-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" /> Delete User
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-3 mb-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">This action cannot be undone. All bookings for this user will remain.</p>
                        </div>
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete <strong>{selected?.name}</strong> ({selected?.email})?
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={closeModal}>Cancel</Button>
                        <Button variant="destructive" className="rounded-xl" onClick={handleDeleteUser} disabled={saving}>
                            {saving ? "Deleting..." : "Delete User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* ─── MANAGE FINANCES MODAL ─── */}
            <Dialog open={modal === "manageFinances"} onOpenChange={() => closeModal()}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black flex items-center gap-2">
                            Manage Finances
                        </DialogTitle>
                        <p className="text-sm text-gray-400">{selected?.name} ({selected?.agencyName || "Agent"})</p>
                    </DialogHeader>
                    <form onSubmit={handleFinance}>
                        <div className="space-y-4 py-4">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-2 flex justify-between text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase font-bold">Total Sales</p>
                                    <p className="font-black text-gray-900">₹{selected?.totalSales || 0}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase font-bold text-right">Unpaid Dues</p>
                                    <p className="font-black text-red-500 text-right">₹{selected?.pendingDues || 0}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Transaction Type</Label>
                                <select className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                    value={form.paymentType || "PAYMENT"} onChange={e => setForm({ ...form, paymentType: e.target.value })}>
                                    <option value="PAYMENT">Record Payment (Reduces Dues)</option>
                                    <option value="DUES">Add Pending Dues (Increases Dues)</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Amount (₹) *</Label>
                                <Input className="rounded-xl" type="number" required placeholder="10000" value={form.amount || ""} onChange={e => setForm({ ...form, amount: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Reference / Notes</Label>
                                <Input className="rounded-xl" placeholder="NEFT-12345" value={form.reference || ""} onChange={e => setForm({ ...form, reference: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                                {saving ? "Saving..." : "Save Transaction"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
