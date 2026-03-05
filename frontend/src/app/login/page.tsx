"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Plane, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/api";

const B = { primary: "#2E0A57", accent: "#6C2BD9" };

const formSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [redirectTarget, setRedirectTarget] = useState<"admin" | "dashboard">("dashboard");
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (storedUser && token && token !== "undefined") {
            try {
                const user = JSON.parse(storedUser);
                router.replace(user.role === "ADMIN" ? "/admin" : "/dashboard");
                // Fallback: If we're still here after 1.5s, something is wrong
                const timer = setTimeout(() => setInitializing(false), 1500);
                return () => clearTimeout(timer);
            } catch {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                setInitializing(false);
            }
        } else {
            // Clear bad token if it exists
            if (token === "undefined") {
                localStorage.removeItem("token");
                document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
            }
            setInitializing(false);
        }
    }, [router]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(values),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to log in");

            const tokenKey = data.access_token || data.token;
            if (!tokenKey) throw new Error("No token received from server");

            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("token", tokenKey);

            // Set token cookie with Secure on HTTPS (crucial for Render)
            const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
            const cookieStr = `token=${tokenKey}; path=/; max-age=86400; SameSite=Lax${isSecure ? "; Secure" : ""}`;
            document.cookie = cookieStr;

            const target: "admin" | "dashboard" = data.user.role === "ADMIN" ? "admin" : "dashboard";

            // Use window.location.href for absolute certainty on cookie propagation
            window.location.href = `/${target}`;
        } catch (error: any) {
            setIsLoading(false);
            toast({ title: "Login Failed", description: error.message, variant: "destructive" });
        }
    }

    if (initializing) {
        return <div style={{ minHeight: "100vh", background: "#F7F7FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 className="animate-spin text-primary" stroke={B.primary} />
        </div>;
    }

    return (
        <div style={{ minHeight: "100vh", background: "#F7F7FB", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: "24px" }}>

            {/* Full-screen redirect loading overlay */}
            {redirecting && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 9999,
                    background: `linear-gradient(135deg, ${B.primary} 0%, ${B.accent} 100%)`,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 24,
                }}>
                    <style>{`
                        @keyframes spin { to { transform: rotate(360deg); } }
                        @keyframes pulse-ring { 0%,100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.15); opacity: 0; } }
                    `}</style>
                    {/* Spinning ring */}
                    <div style={{ position: "relative", width: 80, height: 80 }}>
                        <div style={{
                            position: "absolute", inset: 0,
                            border: "3px solid rgba(255,255,255,0.15)",
                            borderRadius: "50%",
                        }} />
                        <div style={{
                            position: "absolute", inset: 0,
                            border: "3px solid transparent",
                            borderTopColor: "#fff",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                        }} />
                        <div style={{
                            position: "absolute", inset: 8,
                            background: "rgba(255,255,255,0.12)",
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Plane size={22} color="#fff" />
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <p style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em" }}>
                            {redirectTarget === "admin" ? "Opening Admin Panel..." : "Loading Dashboard..."}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, marginTop: 8 }}>
                            Please wait, setting things up for you
                        </p>
                    </div>
                    {/* Progress dots */}
                    <div style={{ display: "flex", gap: 8 }}>
                        {[0, 0.2, 0.4].map((delay, i) => (
                            <div key={i} style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: "rgba(255,255,255,0.6)",
                                animation: `pulse-ring 1.2s ease-in-out ${delay}s infinite`,
                            }} />
                        ))}
                    </div>
                </div>
            )}

            {/* Login Card */}
            <div style={{ width: "100%", maxWidth: 440 }}>
                {/* Logo area */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: 18,
                        background: `linear-gradient(135deg, ${B.primary}, ${B.accent})`,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        marginBottom: 20, boxShadow: `0 10px 28px ${B.primary}40`
                    }}>
                        <Plane size={28} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, color: "#0F0A1A", letterSpacing: "-0.04em", marginBottom: 8 }}>
                        Welcome back
                    </h1>
                    <p style={{ color: "#9CA3AF", fontSize: 14, fontWeight: 500 }}>
                        Sign in to your Flyinco account
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: "#fff", borderRadius: 24,
                    border: "1px solid #F0EEF8",
                    boxShadow: "0 8px 40px rgba(46,10,87,0.08), 0 1px 4px rgba(0,0,0,0.03)",
                    padding: "36px 40px"
                }}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>Email address</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="you@example.com"
                                                className="rounded-xl h-11 text-sm"
                                                {...field}
                                                disabled={isLoading || redirecting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>Password</FormLabel>
                                        <FormControl>
                                            <div style={{ position: "relative" }}>
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="rounded-xl h-11 text-sm"
                                                    style={{ paddingRight: 44 }}
                                                    {...field}
                                                    disabled={isLoading || redirecting}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{
                                                        position: "absolute", right: 14, top: "50%",
                                                        transform: "translateY(-50%)", background: "none",
                                                        border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0
                                                    }}
                                                    disabled={isLoading}
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <button
                                type="submit"
                                disabled={isLoading || redirecting}
                                style={{
                                    width: "100%", height: 48, marginTop: 4,
                                    background: `linear-gradient(135deg, ${B.primary} 0%, ${B.accent} 100%)`,
                                    color: "#fff", border: "none", borderRadius: 12,
                                    fontWeight: 800, fontSize: 15, cursor: isLoading || redirecting ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    boxShadow: `0 8px 24px ${B.primary}44`,
                                    opacity: isLoading || redirecting ? 0.75 : 1,
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {isLoading && <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />}
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                {isLoading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>
                    </Form>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
                        <div style={{ flex: 1, height: 1, background: "#F0EEF8" }} />
                        <span style={{ color: "#C4B5FD", fontSize: 12, fontWeight: 600 }}>OR</span>
                        <div style={{ flex: 1, height: 1, background: "#F0EEF8" }} />
                    </div>

                    <p style={{ textAlign: "center", color: "#6B7280", fontSize: 14 }}>
                        Don&apos;t have an account?{" "}
                        <Link href="/register" style={{ color: B.accent, fontWeight: 700, textDecoration: "none" }}>
                            Sign up
                        </Link>
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, color: "#9CA3AF", fontSize: 13 }}>
                    <ShieldCheck size={14} color="#10B981" />
                    <span>Secured · Flyinco Travel Portal</span>
                </div>
            </div>
        </div>
    );
}
