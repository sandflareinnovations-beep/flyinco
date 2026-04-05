"use client";
import {
    PiSquaresFour,
    PiBookOpen,
    PiAirplaneTilt,
    PiChartBar,
    PiSignOut,
    PiTicket,
} from "react-icons/pi";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
    {
        group: "Overview",
        links: [
            { href: "/staff", label: "Dashboard", icon: PiSquaresFour, exact: true },
        ],
    },
    {
        group: "Operations",
        links: [
            { href: "/staff/book", label: "Book Tickets", icon: PiTicket, exact: false },
            { href: "/staff/bookings", label: "View Bookings", icon: PiBookOpen, exact: false },
        ],
    },
    {
        group: "Reports",
        links: [
            { href: "/staff/reports", label: "Route Reports", icon: PiChartBar, exact: false },
        ],
    },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
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
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/login");
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 hidden md:flex">
                {/* Sidebar Header */}
                <div className="h-[72px] flex items-center px-6 border-b border-gray-100 bg-white">
                    <Link href="/staff">
                        <Image
                            src="/logo.png"
                            alt="Flyinco"
                            width={130}
                            height={40}
                            className="h-9 w-auto object-contain"
                            priority
                        />
                    </Link>
                </div>

                {/* Nav links */}
                <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
                    {navigation.map((group) => (
                        <div key={group.group}>
                            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {group.group}
                            </p>
                            <div className="space-y-1">
                                {group.links.map(({ href, label, icon: Icon, exact }) => {
                                    const active = exact ? pathname === href : pathname.startsWith(href);
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            className={cn(
                                                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                                                active
                                                    ? "text-white shadow-md shadow-purple-100"
                                                    : "text-gray-500 hover:bg-purple-50/50 hover:text-gray-900"
                                            )}
                                            style={active ? { backgroundColor: "#2E0A57" } : {}}
                                        >
                                            <Icon
                                                className={cn(
                                                    "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                                                    active ? "text-white" : "text-gray-400 group-hover:text-purple-600"
                                                )}
                                            />
                                            {label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                    <div className="flex items-center gap-3 px-3 py-2.5 mb-3 bg-white border border-gray-100 rounded-2xl">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-inner"
                            style={{ backgroundColor: "#2E0A57" }}
                        >
                            {user?.name?.charAt(0) || "S"}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                                {user?.name || "Staff"}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                {user?.email || "staff@flyinco.com"}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl px-3 py-2 h-10 font-semibold"
                        onClick={handleLogout}
                    >
                        <PiSignOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
                {children}
            </main>
        </div>
    );
}
