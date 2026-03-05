"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Users, Mail, Phone, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { flyApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function UsersAdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchUsers() {
            try {
                const data = await flyApi.users.list();
                setUsers(data);
            } catch (error: any) {
                toast({
                    title: "Error fetching users",
                    description: error.message,
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsers();
    }, [toast]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading users...</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">View all registered customers and agents on the platform.</p>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Registered Users
                    </CardTitle>
                    <CardDescription>
                        A total of {users.length} user(s) have registered.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[100px] whitespace-nowrap">User ID</TableHead>
                                    <TableHead className="whitespace-nowrap">Name</TableHead>
                                    <TableHead className="whitespace-nowrap">Email</TableHead>
                                    <TableHead className="whitespace-nowrap">Phone</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">Created Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-muted/30">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {user.id.substring(0, 8)}...
                                            </TableCell>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    {user.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {user.phone ? (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        {user.phone}
                                                    </div>
                                                ) : <span className="text-muted-foreground text-sm">-</span>}
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(user.createdAt), "MMM dd, yyyy")}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
