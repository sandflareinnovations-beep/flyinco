"use client";
import { PiUsers, PiPlus, PiTarget, PiCheckCircle, PiClock, PiTrash, PiPencil, PiMagnifyingGlass } from "react-icons/pi";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { flyApi, fetchWithCreds } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type ModalType = "addTask" | "viewTasks" | null;

export default function StaffManagementPage() {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<ModalType>(null);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ title: "", description: "", target: "", priority: "MEDIUM", type: "BOOKING", dueDate: "" });
    const { toast } = useToast();

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const data = await flyApi.users.list({ limit: 1000 });
            const list = Array.isArray(data) ? data : (data.users || []);
            setStaff(list.filter((u: any) => u.role === "STAFF"));
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStaff(); }, []);

    const fetchTasks = async (staffId: string) => {
        try {
            const data = await fetchWithCreds(`/tasks?limit=100`);
            setTasks(data.tasks?.filter((t: any) => t.assignedToId === staffId) || []);
        } catch (err: any) {
            console.error(err);
        }
    };

    const openTasksModal = (s: any) => {
        setSelectedStaff(s);
        fetchTasks(s.id);
        setModal("viewTasks");
    };

    const handleCreateTask = async () => {
        if (!selectedStaff) return;
        try {
            await fetchWithCreds('/tasks', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    target: form.target ? parseInt(form.target) : null,
                    assignedToId: selectedStaff.id,
                }),
            });
            toast({ title: "Task Created", description: `Task assigned to ${selectedStaff.name}` });
            setForm({ title: "", description: "", target: "", priority: "MEDIUM", type: "BOOKING", dueDate: "" });
            fetchTasks(selectedStaff.id);
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, status: string) => {
        try {
            await fetchWithCreds(`/tasks/${taskId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            if (selectedStaff) fetchTasks(selectedStaff.id);
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await fetchWithCreds(`/tasks/${taskId}`, { method: 'DELETE' });
            if (selectedStaff) fetchTasks(selectedStaff.id);
            toast({ title: "Task Deleted" });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const filteredStaff = staff.filter(s => 
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch(status) {
            case "COMPLETED": return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
            case "IN_PROGRESS": return <Badge className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
            default: return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Staff Management</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Assign tasks and targets to staff members.</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search staff..."
                        className="pl-9 rounded-xl border-gray-200"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Staff List */}
            {loading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : filteredStaff.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <PiUsers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-gray-900">No Staff Found</h2>
                    <p className="text-gray-400 text-sm mt-1">Create staff users in User Management.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Staff Name</TableHead>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Email</TableHead>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Phone</TableHead>
                                <TableHead className="text-xs font-black text-gray-500 uppercase">Joined</TableHead>
                                <TableHead className="text-right text-xs font-black text-gray-500 uppercase">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStaff.map((s) => (
                                <TableRow key={s.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-xs font-bold text-blue-600">{s.name?.charAt(0)}</span>
                                            </div>
                                            <span className="font-semibold">{s.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">{s.email}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{s.phone || '-'}</TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {s.createdAt ? format(new Date(s.createdAt), 'dd MMM yyyy') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => openTasksModal(s)} className="rounded-xl gap-1">
                                            <PiTarget className="h-4 w-4" /> Tasks
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Tasks Modal */}
            <Dialog open={modal === "viewTasks"} onOpenChange={() => setModal(null)}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Tasks for {selectedStaff?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Add Task Form */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Assign New Task</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Task Title *</Label>
                                    <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Achieve 50 bookings" className="h-8 text-sm" />
                                </div>
                                <div>
                                    <Label className="text-xs">Target</Label>
                                    <Input type="number" value={form.target} onChange={e => setForm({...form, target: e.target.value})} placeholder="e.g. 50" className="h-8 text-sm" />
                                </div>
                                <div>
                                    <Label className="text-xs">Priority</Label>
                                    <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="h-8 text-sm border rounded px-2 w-full">
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs">Due Date</Label>
                                    <Input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="h-8 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-xs">Description</Label>
                                    <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Task details..." className="h-8 text-sm" />
                                </div>
                            </div>
                            <Button onClick={handleCreateTask} disabled={!form.title} className="mt-3 rounded-xl w-full">
                                <PiPlus className="h-4 w-4 mr-1" /> Assign Task
                            </Button>
                        </div>

                        {/* Existing Tasks */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">Current Tasks</h4>
                            {tasks.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No tasks assigned</p>
                            ) : (
                                tasks.map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-3 bg-white border rounded-xl">
                                        <div>
                                            <p className="font-semibold text-sm">{task.title}</p>
                                            <p className="text-xs text-gray-500">{task.description}</p>
                                            {task.target && (
                                                <p className="text-xs text-violet-600 mt-1">
                                                    Progress: {task.current || 0} / {task.target}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(task.status)}
                                            <select 
                                                value={task.status} 
                                                onChange={e => handleUpdateTaskStatus(task.id, e.target.value)}
                                                className="text-xs border rounded px-2 py-1"
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)} className="text-red-500 p-1">
                                                <PiTrash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
