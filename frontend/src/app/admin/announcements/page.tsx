"use client";
import { PiPlus, PiTrash, PiMegaphone, PiEnvelopeSimple } from "react-icons/pi";
import { useEffect, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { flyApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ROLE_OPTIONS = [
    { value: "ALL", label: "Everyone" },
    { value: "AGENT", label: "Agents" },
    { value: "STAFF", label: "Staff" },
    { value: "USER", label: "Customers" },
];

const TYPE_OPTIONS = [
    { value: "INFO", label: "Info", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "WARNING", label: "Warning", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "ALERT", label: "Alert", color: "bg-red-50 text-red-700 border-red-200" },
    { value: "SUCCESS", label: "Success", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState<"add" | null>(null);
    const [form, setForm] = useState<any>({ type: "INFO", targetRoles: ["ALL"], sendEmail: false });
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        try {
            const data = await flyApi.announcements.list();
            setAnnouncements(data);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await flyApi.announcements.create(form);
            toast({
                title: "Published",
                description: form.sendEmail
                    ? "Announcement published and emails sent."
                    : "Announcement published successfully.",
            });
            fetchAnnouncements();
            setModal(null);
            setForm({ type: "INFO", targetRoles: ["ALL"], sendEmail: false });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await flyApi.announcements.delete(id);
            toast({ title: "Deleted", description: "Announcement removed." });
            fetchAnnouncements();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const toggleRole = (role: string) => {
        const current: string[] = form.targetRoles || [];
        if (role === "ALL") {
            setForm({ ...form, targetRoles: ["ALL"] });
            return;
        }
        let updated = current.filter((r: string) => r !== "ALL");
        if (updated.includes(role)) {
            updated = updated.filter((r: string) => r !== role);
        } else {
            updated.push(role);
        }
        if (updated.length === 0) updated = ["ALL"];
        setForm({ ...form, targetRoles: updated });
    };

    const getTypeBadge = (type: string) => {
        const t = TYPE_OPTIONS.find(o => o.value === type) || TYPE_OPTIONS[0];
        return <Badge variant="outline" className={`${t.color} text-[10px] font-bold`}>{t.label}</Badge>;
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Announcements</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Broadcast messages to agents, staff, and customers.</p>
                </div>
                <Button className="rounded-xl gap-2 font-semibold bg-primary text-white" onClick={() => setModal("add")}>
                    <PiPlus className="h-4 w-4" /> New Announcement
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 border-gray-100">
                            <TableHead className="font-bold text-gray-500 uppercase text-xs">Title</TableHead>
                            <TableHead className="font-bold text-gray-500 uppercase text-xs">Type</TableHead>
                            <TableHead className="font-bold text-gray-500 uppercase text-xs">Target</TableHead>
                            <TableHead className="font-bold text-gray-500 uppercase text-xs w-1/3">Content</TableHead>
                            <TableHead className="font-bold text-gray-500 uppercase text-xs">Date</TableHead>
                            <TableHead className="font-bold text-gray-500 uppercase text-xs text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                        ) : announcements.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">No announcements found.</TableCell></TableRow>
                        ) : announcements.map(ann => (
                            <TableRow key={ann.id}>
                                <TableCell className="font-bold text-sm">{ann.title}</TableCell>
                                <TableCell>{getTypeBadge(ann.type)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {(ann.targetRoles || ["ALL"]).map((r: string) => (
                                            <Badge key={r} variant="outline" className="text-[10px] font-bold text-gray-600 border-gray-200">
                                                {r}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 line-clamp-2">{ann.content}</TableCell>
                                <TableCell className="text-sm text-gray-400 whitespace-nowrap">{format(new Date(ann.createdAt), "MMM dd, yyyy")}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ann.id)} className="text-red-500 hover:bg-red-50">
                                        <PiTrash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={modal === "add"} onOpenChange={(open) => !open && setModal(null)}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PiMegaphone className="h-5 w-5 text-violet-600" />
                            New Announcement
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Title</Label>
                            <Input required value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Price Update for Sector X" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Content</Label>
                            <textarea
                                required
                                value={form.content || ""}
                                onChange={(e: any) => setForm({ ...form, content: e.target.value })}
                                rows={4}
                                placeholder="Message details..."
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                            />
                        </div>

                        {/* Type */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Type</Label>
                            <div className="flex gap-2">
                                {TYPE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, type: opt.value })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                            form.type === opt.value
                                                ? opt.color + " ring-2 ring-offset-1 ring-violet-300"
                                                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Roles */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Target Audience</Label>
                            <div className="flex flex-wrap gap-2">
                                {ROLE_OPTIONS.map(opt => {
                                    const selected = (form.targetRoles || []).includes(opt.value);
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => toggleRole(opt.value)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                                selected
                                                    ? "bg-violet-50 text-violet-700 border-violet-300 ring-2 ring-offset-1 ring-violet-200"
                                                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Send Email Toggle */}
                        <div className="border-t border-gray-100 pt-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div
                                    onClick={() => setForm({ ...form, sendEmail: !form.sendEmail })}
                                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                                        form.sendEmail ? "bg-violet-600" : "bg-gray-300"
                                    }`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                        form.sendEmail ? "translate-x-5" : "translate-x-0"
                                    }`} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                        <PiEnvelopeSimple className="h-4 w-4" />
                                        Send Email Notification
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {form.sendEmail
                                            ? `Emails will be sent to all ${(form.targetRoles || ["ALL"]).includes("ALL") ? "users" : (form.targetRoles || []).join(", ").toLowerCase()}`
                                            : "Dashboard-only, no email notification"}
                                    </p>
                                </div>
                            </label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModal(null)} className="rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={saving} className="rounded-xl gap-2">
                                {form.sendEmail && <PiEnvelopeSimple className="h-4 w-4" />}
                                {saving ? "Publishing..." : form.sendEmail ? "Publish & Send" : "Publish"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
