"use client";
import { PiPlus, PiTrash, PiMegaphone } from "react-icons/pi";
import { useEffect, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { flyApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState<"add" | null>(null);
    const [form, setForm] = useState<any>({});
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
            toast({ title: "Created", description: "Announcement published successfully." });
            fetchAnnouncements();
            setModal(null);
            setForm({});
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

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Announcements</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Broadcast messages to agents.</p>
                </div>
                <Button className="rounded-xl gap-2 font-semibold bg-primary text-white" onClick={() => setModal("add")}>
                    <PiPlus className="h-4 w-4" /> New Announcement
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 border-gray-100">
                            <TableHead className="font-bold text-gray-500 uppercase">Title</TableHead>
                            <TableHead className="font-bold text-gray-500 uppercase w-1/2">Content</TableHead>
                            <TableHead className="font-bold text-gray-500 uppercase">Date</TableHead>
                            <TableHead className="font-bold text-gray-500 uppercase text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                        ) : announcements.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8">No announcements found.</TableCell></TableRow>
                        ) : announcements.map(ann => (
                            <TableRow key={ann.id}>
                                <TableCell className="font-bold">{ann.title}</TableCell>
                                <TableCell className="text-sm text-gray-600 line-clamp-2">{ann.content}</TableCell>
                                <TableCell className="text-sm text-gray-400">{format(new Date(ann.createdAt), "MMM dd, yyyy")}</TableCell>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Announcement</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input required value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Price Update for Sector X" />
                        </div>
                        <div className="space-y-2">
                            <Label>Content</Label>
                            <textarea 
                                required 
                                value={form.content || ""} 
                                onChange={(e: any) => setForm({ ...form, content: e.target.value })} 
                                rows={5} 
                                placeholder="Message details..." 
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
                            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Publish"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
