"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    ShieldCheck, BookOpen, Plane, LayoutDashboard,
    Users, LogOut, Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/sectors", label: "Sector Management", icon: Plane },
    { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/login");
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col min-h-screen flex-shrink-0 hidden md:flex">
                {/* Sidebar Header */}
                <div className="h-[72px] flex items-center px-4 border-b border-gray-100 bg-white">
                    <Link href="/admin">
                        <Image
                            src="/logo.png"
                            alt="Flyinco"
                            width={150}
                            height={50}
                            className="h-11 w-auto object-contain"
                            priority
                        />
                    </Link>
                </div>

                {/* Nav links */}
                <nav className="flex-1 p-3 space-y-1">
                    {links.map(({ href, label, icon: Icon, exact }) => {
                        const active = exact ? pathname === href : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                                    active
                                        ? "text-white shadow-sm"
                                        : "text-gray-600 hover:bg-purple-50 hover:text-gray-900"
                                )}
                                style={active ? { backgroundColor: "#2E0A57" } : {}}
                            >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar footer */}
                <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F3F0FF" }}>
                            <ShieldCheck className="h-4 w-4" style={{ color: "#2E0A57" }} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-800">{user?.name || "Admin"}</p>
                            <p className="text-[10px] text-gray-400">{user?.email || "sabith@flyinco.com"}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
                {children}
            </main>
        </div>
    );
}
