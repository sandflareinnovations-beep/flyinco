"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PiEye, PiEyeClosed, PiX, PiAirplaneTilt } from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@/lib/api";

// ── Dark purple + white only ──────────────────────────
const P = {
  bg:       "#08061A",          // modal deep background
  card:     "#100D24",          // modal card surface
  border:   "rgba(124,58,237,0.22)",
  purple:   "#7C3AED",
  deep:     "#4C1D95",
  btn:      "linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)",
  input:    "rgba(124,58,237,0.07)",
  inputBdr: "rgba(124,58,237,0.18)",
  focus:    "rgba(124,58,237,0.45)",
  white:    "#FFFFFF",
  dim:      "rgba(255,255,255,0.55)",
  faint:    "rgba(255,255,255,0.15)",
};

// ── Shared input renderer (must be outside Navbar to avoid re-mount on every render) ──
function Field({ label, type = "text", value, onChange, placeholder, pw, showPw, onTogglePw, disabled }: any) {
    return (
        <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: P.dim, display: "block",
                marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {label}
            </label>
            <div style={{ position: "relative" }}>
                <input
                    type={pw ? (showPw ? "text" : "password") : type}
                    value={value} onChange={onChange} placeholder={placeholder}
                    disabled={disabled} required
                    style={{
                        width: "100%", height: 44, borderRadius: 10, padding: "0 14px",
                        paddingRight: pw ? 44 : 14,
                        background: P.input,
                        border: `1.5px solid ${P.inputBdr}`,
                        color: P.white, fontSize: 14, outline: "none",
                        transition: "border-color 0.18s, background 0.18s",
                        boxSizing: "border-box",
                    }}
                    onFocus={e => { e.target.style.borderColor = P.purple; e.target.style.background = "rgba(124,58,237,0.13)"; }}
                    onBlur={e  => { e.target.style.borderColor = P.inputBdr; e.target.style.background = P.input; }}
                />
                {pw && (
                    <button type="button" onClick={onTogglePw} disabled={disabled}
                        style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer",
                            color: P.faint, padding: 0, display: "flex" }}>
                        {showPw ? <PiEyeClosed size={16} /> : <PiEye size={16} />}
                    </button>
                )}
            </div>
        </div>
    );
}

const submitBtn: React.CSSProperties = {
    width: "100%", height: 48, marginTop: 6,
    background: P.btn, color: P.white,
    border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15,
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", gap: 9,
    boxShadow: "0 6px 20px rgba(76,29,149,0.55)",
    transition: "all 0.2s ease",
};

export function Navbar() {
    const [hovered, setHovered] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [tab, setTab] = useState<"login" | "signup">("login");
    const pathname = usePathname();
    const isHome = pathname === "/";

    // Login
    const [loginEmail, setLoginEmail]       = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPw, setShowLoginPw]     = useState(false);
    const [loginLoading, setLoginLoading]   = useState(false);
    const [loginError, setLoginError]       = useState("");
    const [loginAnimating, setLoginAnimating] = useState(false);
    const [loginTarget, setLoginTarget]     = useState<"admin" | "dashboard">("dashboard");

    // Signup
    const [signupName,     setSignupName]     = useState("");
    const [signupEmail,    setSignupEmail]    = useState("");
    const [signupPhone,    setSignupPhone]    = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupConfirm,  setSignupConfirm]  = useState("");
    const [showSignupPw,   setShowSignupPw]   = useState(false);
    const [signupLoading,  setSignupLoading]  = useState(false);
    const [signupError,    setSignupError]    = useState("");
    const [signupSuccess,  setSignupSuccess]  = useState("");

    function closeModal() {
        if (loginLoading || loginAnimating || signupLoading) return;
        setShowModal(false);
        setLoginError(""); setSignupError(""); setSignupSuccess("");
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        if (!loginEmail || !loginPassword) { setLoginError("Please fill in all fields."); return; }
        setLoginLoading(true); setLoginError("");
        try {
            const res  = await fetch(`${API_BASE}/auth/login`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Invalid credentials");
            const tokenKey = data.token || data.access_token;
            if (!tokenKey) throw new Error("No token received");
            localStorage.setItem("user",  JSON.stringify(data.user));
            localStorage.setItem("token", tokenKey);
            if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
            const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
            document.cookie = `token=${tokenKey}; path=/; max-age=86400; SameSite=Lax${isSecure ? "; Secure" : ""}`;
            const target: "admin" | "staff" | "dashboard" = data.user.role === "ADMIN" ? "admin" : data.user.role === "STAFF" ? "staff" : "dashboard";
            setLoginTarget(target);
            setLoginLoading(false);
            setLoginAnimating(true);
            setTimeout(() => { 
                const dest = target === "staff" ? "/staff" : `/${target}`;
                window.location.href = dest; 
            }, 2200);
        } catch (err: any) {
            setLoginError(err.message);
        } finally {
            setLoginLoading(false);
        }
    }

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        if (!signupName || !signupEmail || !signupPhone || !signupPassword) { setSignupError("Please fill in all fields."); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) { setSignupError("Please enter a valid email address."); return; }
        if (!/^\+?[\d\s\-()]{7,}$/.test(signupPhone)) { setSignupError("Please enter a valid phone number."); return; }
        if (signupPassword !== signupConfirm) { setSignupError("Passwords do not match."); return; }
        if (signupPassword.length < 6) { setSignupError("Password must be at least 6 characters."); return; }
        setSignupLoading(true); setSignupError(""); setSignupSuccess("");
        try {
            const res  = await fetch(`${API_BASE}/auth/register`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name: signupName, email: signupEmail, phone: signupPhone, password: signupPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Registration failed");
            setSignupSuccess("Account created! Switching to sign in…");
            setSignupName(""); setSignupEmail(""); setSignupPhone(""); setSignupPassword(""); setSignupConfirm("");
            setTimeout(() => { setTab("login"); setSignupSuccess(""); }, 1600);
        } catch (err: any) {
            setSignupError(err.message);
        } finally {
            setSignupLoading(false);
        }
    }

    return (
        <>
            <style>{`
                @keyframes flyAcross {
                    0%   { transform: translateX(-80px) translateY(10px) rotate(-5deg); opacity:0; }
                    10%  { opacity:1; }
                    50%  { transform: translateX(0) translateY(-12px) rotate(5deg); }
                    90%  { opacity:1; }
                    100% { transform: translateX(80px) translateY(10px) rotate(-5deg); opacity:0; }
                }
                @keyframes pulseGlow {
                    0%,100% { box-shadow: 0 0 22px rgba(76,29,149,0.6), 0 0 44px rgba(76,29,149,0.25); }
                    50%     { box-shadow: 0 0 32px rgba(124,58,237,0.8), 0 0 64px rgba(124,58,237,0.35); }
                }
                @keyframes trailFade {
                    0%,100% { opacity:0; transform:scaleX(0.3); }
                    50%     { opacity:0.35; transform:scaleX(1); }
                }
                @keyframes dotBounce {
                    0%,80%,100% { transform:translateY(0); opacity:0.35; }
                    40%         { transform:translateY(-7px); opacity:1; }
                }
                @keyframes spinRing { to { transform:rotate(360deg); } }
                input::placeholder { color: rgba(255,255,255,0.22) !important; }
            `}</style>

            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-50" style={{
                background: isHome ? "transparent" : "white",
                borderBottom: isHome ? "none" : "1px solid #E5E7EB",
                boxShadow:   isHome ? "none"  : "0 1px 3px rgba(0,0,0,0.05)",
            }}>
                <div className="flex items-center justify-between"
                    style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 64 }}>
                    <Link href="/" style={{ display: "flex", alignItems: "center" }}>
                        <Image src="/logo.png" alt="Flyinco" width={180} height={48}
                            style={{ height: isHome ? 48 : 36, width: "auto",
                                filter: isHome ? "brightness(0) invert(1)" : "none",
                                transition: "height 0.2s ease" }}
                            className="object-contain" priority />
                    </Link>

                    {isHome && (
                        <button
                            onClick={() => { setShowModal(true); setTab("login"); }}
                            onMouseEnter={() => setHovered(true)}
                            onMouseLeave={() => setHovered(false)}
                            style={{
                                background: hovered ? "linear-gradient(135deg,#3B0F70 0%,#5B21B6 100%)" : P.btn,
                                color: P.white, fontSize: 13, fontWeight: 700,
                                padding: "9px 22px", borderRadius: 10, border: "none",
                                cursor: "pointer", transition: "all 0.2s ease",
                                letterSpacing: "0.01em",
                                boxShadow: hovered ? "0 6px 22px rgba(76,29,149,0.65)" : "0 4px 14px rgba(76,29,149,0.45)",
                                display: "flex", alignItems: "center", gap: 7,
                                transform: hovered ? "translateY(-1px)" : "translateY(0)",
                            }}
                        >
                            Login / Sign Up
                        </button>
                    )}
                </div>
            </nav>

            {/* ── Flight animation overlay (on login success) ── */}
            <AnimatePresence>
                {loginAnimating && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        style={{
                            position: "fixed", inset: 0, zIndex: 99999,
                            background: `linear-gradient(135deg, #08061A 0%, ${P.card} 50%, #0F0A2A 100%)`,
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center", gap: 32,
                        }}
                    >
                        <motion.div initial={{ scale:0.6, opacity:0 }} animate={{ scale:1, opacity:1 }}
                            transition={{ duration:0.4, ease:"backOut" }}
                            style={{
                                width: 80, height: 80, borderRadius: 22,
                                background: P.btn,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                animation: "pulseGlow 1.8s ease-in-out infinite",
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/favicon.png" alt="Flyinco" width={46} height={46}
                                style={{ objectFit: "contain" }} />
                        </motion.div>

                        {/* Airplane + trail */}
                        <div style={{ position: "relative", width: 240, height: 48, overflow: "hidden" }}>
                            <div style={{
                                position: "absolute", top: "50%", left: "10%", right: "10%", height: 1.5,
                                background: `linear-gradient(90deg, transparent, ${P.purple}66, transparent)`,
                                transform: "translateY(-50%)",
                                animation: "trailFade 1.4s ease-in-out infinite",
                            }} />
                            <div style={{
                                position: "absolute", top: "50%", left: "50%",
                                transform: "translate(-50%,-50%)",
                                animation: "flyAcross 1.4s ease-in-out infinite",
                            }}>
                                <PiAirplaneTilt size={28} color={P.white} />
                            </div>
                        </div>

                        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                            transition={{ delay:0.3 }} style={{ textAlign: "center" }}>
                            <p style={{ color: P.white, fontWeight: 800, fontSize: 20,
                                letterSpacing: "-0.03em", marginBottom: 6 }}>
                                {loginTarget === "admin" ? "Opening Admin Panel…" : "Loading Your Dashboard…"}
                            </p>
                            <p style={{ color: P.dim, fontSize: 13, marginBottom: 20 }}>
                                Flyinco B2B Portal
                            </p>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                {[0, 0.18, 0.36].map((delay, i) => (
                                    <div key={i} style={{
                                        width: 7, height: 7, borderRadius: "50%",
                                        background: P.btn,
                                        animation: `dotBounce 0.9s ease-in-out ${delay}s infinite`,
                                    }} />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Auth Modal ── */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        style={{
                            position: "fixed", inset: 0, zIndex: 9999,
                            background: "rgba(4,3,14,0.82)", backdropFilter: "blur(12px)",
                            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
                        }}
                        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                    >
                        <motion.div
                            initial={{ opacity:0, scale:0.93, y:20 }}
                            animate={{ opacity:1, scale:1,   y:0  }}
                            exit={{   opacity:0, scale:0.93, y:20 }}
                            transition={{ duration:0.25, ease:"backOut" }}
                            style={{
                                background: P.card,
                                borderRadius: 22,
                                border: `1px solid ${P.border}`,
                                boxShadow: `0 40px 100px rgba(4,3,14,0.8), inset 0 1px 0 rgba(124,58,237,0.12)`,
                                width: "100%", maxWidth: 420,
                                overflow: "hidden", position: "relative",
                            }}
                        >
                            {/* Purple top accent */}
                            <div style={{ height: 3, background: P.btn }} />

                            {/* Close */}
                            <button onClick={closeModal} style={{
                                position: "absolute", top: 18, right: 18,
                                background: "rgba(124,58,237,0.1)",
                                border: `1px solid ${P.border}`,
                                borderRadius: "50%", width: 30, height: 30,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", color: P.dim, transition: "all 0.15s", zIndex: 2,
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.22)"; (e.currentTarget as HTMLButtonElement).style.color = P.white; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = P.dim; }}
                            >
                                <PiX size={15} />
                            </button>

                            <div style={{ padding: "22px 28px 28px" }}>

                                {/* Header — Flyinco B2B Portal */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        background: P.btn, flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: `0 6px 18px rgba(76,29,149,0.5)`,
                                    }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="/favicon.png" alt="Flyinco" width={24} height={24}
                                            style={{ objectFit: "contain" }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: P.white,
                                            letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                                            Flyinco B2B Portal
                                        </div>
                                        <div style={{ fontSize: 11, color: P.dim, marginTop: 3,
                                            letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
                                            {tab === "login" ? "Agent Sign In" : "Create Agent Account"}
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div style={{
                                    display: "flex",
                                    background: "rgba(124,58,237,0.06)",
                                    borderRadius: 12, padding: 4, gap: 4, marginBottom: 22,
                                    border: `1px solid ${P.border}`,
                                }}>
                                    {(["login","signup"] as const).map(t => (
                                        <button key={t}
                                            onClick={() => { setTab(t); setLoginError(""); setSignupError(""); }}
                                            style={{
                                                flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
                                                background: tab === t ? P.btn : "transparent",
                                                color: tab === t ? P.white : P.dim,
                                                fontSize: 13, fontWeight: 700, cursor: "pointer",
                                                transition: "all 0.18s ease",
                                                boxShadow: tab === t ? "0 4px 12px rgba(76,29,149,0.4)" : "none",
                                            }}
                                        >
                                            {t === "login" ? "Login" : "Sign Up"}
                                        </button>
                                    ))}
                                </div>

                                {/* Forms */}
                                <AnimatePresence mode="wait">
                                    {tab === "login" && (
                                        <motion.form key="login"
                                            initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                                            exit={{ opacity:0, x:12 }} transition={{ duration:0.18 }}
                                            onSubmit={handleLogin}
                                            style={{ display: "flex", flexDirection: "column", gap: 16 }}
                                        >
                                            <Field label="Email" type="email" value={loginEmail}
                                                onChange={(e: any) => setLoginEmail(e.target.value)}
                                                placeholder="Enter your email" disabled={loginLoading} />
                                            <Field label="Password" pw showPw={showLoginPw}
                                                onTogglePw={() => setShowLoginPw(!showLoginPw)}
                                                value={loginPassword}
                                                onChange={(e: any) => setLoginPassword(e.target.value)}
                                                placeholder="Enter password" disabled={loginLoading} />

                                            {loginError && (
                                                <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                                                    style={{
                                                        background: "rgba(124,58,237,0.1)",
                                                        border: `1px solid rgba(124,58,237,0.3)`,
                                                        borderRadius: 10, padding: "10px 14px",
                                                        fontSize: 13, color: "rgba(255,255,255,0.8)",
                                                        display: "flex", alignItems: "center", gap: 8,
                                                    }}>
                                                    <span style={{ color: P.purple }}>⚠</span> {loginError}
                                                </motion.div>
                                            )}

                                            <button type="submit" disabled={loginLoading}
                                                style={{ ...submitBtn, opacity: loginLoading ? 0.8 : 1, cursor: loginLoading ? "not-allowed" : "pointer" }}
                                                onMouseEnter={e => { if (!loginLoading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(76,29,149,0.65)"; }}}
                                                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(76,29,149,0.55)"; }}
                                            >
                                                {loginLoading
                                                    ? <><span style={{ display:"inline-block", width:16, height:16, border:"2px solid rgba(255,255,255,0.25)", borderTopColor:P.white, borderRadius:"50%", animation:"spinRing 0.7s linear infinite" }} /> Signing in…</>
                                                    : "Sign In"
                                                }
                                            </button>

                                            <p style={{ textAlign: "center", color: P.dim, fontSize: 13 }}>
                                                No account?{" "}
                                                <button type="button" onClick={() => setTab("signup")}
                                                    style={{ background:"none", border:"none", color: P.faint,
                                                        fontWeight: 700, cursor: "pointer", padding: 0,
                                                        fontSize: 13, textDecoration: "underline",
                                                        textUnderlineOffset: 3 }}>
                                                    Sign up
                                                </button>
                                            </p>
                                        </motion.form>
                                    )}

                                    {tab === "signup" && (
                                        <motion.form key="signup"
                                            initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }}
                                            exit={{ opacity:0, x:-12 }} transition={{ duration:0.18 }}
                                            onSubmit={handleSignup}
                                            style={{ display: "flex", flexDirection: "column", gap: 14 }}
                                        >
                                            <Field label="Full Name" value={signupName}
                                                onChange={(e: any) => setSignupName(e.target.value)}
                                                placeholder="Enter full name" disabled={signupLoading} />
                                            <Field label="Email" type="email" value={signupEmail}
                                                onChange={(e: any) => setSignupEmail(e.target.value)}
                                                placeholder="Enter email address" disabled={signupLoading} />
                                            <Field label="Phone" type="tel" value={signupPhone}
                                                onChange={(e: any) => setSignupPhone(e.target.value)}
                                                placeholder="Enter phone number" disabled={signupLoading} />
                                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                                                <Field label="Password" pw showPw={showSignupPw}
                                                    onTogglePw={() => setShowSignupPw(!showSignupPw)}
                                                    value={signupPassword}
                                                    onChange={(e: any) => setSignupPassword(e.target.value)}
                                                    placeholder="Password" disabled={signupLoading} />
                                                <Field label="Confirm" type="password" value={signupConfirm}
                                                    onChange={(e: any) => setSignupConfirm(e.target.value)}
                                                    placeholder="Confirm" disabled={signupLoading} />
                                            </div>

                                            {signupError && (
                                                <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                                                    style={{
                                                        background: "rgba(124,58,237,0.1)",
                                                        border: `1px solid rgba(124,58,237,0.3)`,
                                                        borderRadius: 10, padding: "10px 14px",
                                                        fontSize: 13, color: "rgba(255,255,255,0.8)",
                                                        display: "flex", alignItems: "center", gap: 8,
                                                    }}>
                                                    <span style={{ color: P.purple }}>⚠</span> {signupError}
                                                </motion.div>
                                            )}
                                            {signupSuccess && (
                                                <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                                                    style={{
                                                        background: "rgba(124,58,237,0.12)",
                                                        border: `1px solid rgba(124,58,237,0.35)`,
                                                        borderRadius: 10, padding: "10px 14px",
                                                        fontSize: 13, color: P.white,
                                                        display: "flex", alignItems: "center", gap: 8,
                                                    }}>
                                                    <span style={{ color: P.purple }}>✓</span> {signupSuccess}
                                                </motion.div>
                                            )}

                                            <button type="submit" disabled={signupLoading}
                                                style={{ ...submitBtn, opacity: signupLoading ? 0.8 : 1, cursor: signupLoading ? "not-allowed" : "pointer" }}
                                            >
                                                {signupLoading
                                                    ? <><span style={{ display:"inline-block", width:16, height:16, border:"2px solid rgba(255,255,255,0.25)", borderTopColor:P.white, borderRadius:"50%", animation:"spinRing 0.7s linear infinite" }} /> Creating…</>
                                                    : "Create Account"
                                                }
                                            </button>

                                            <p style={{ textAlign: "center", color: P.dim, fontSize: 13 }}>
                                                Have an account?{" "}
                                                <button type="button" onClick={() => setTab("login")}
                                                    style={{ background:"none", border:"none", color: P.faint,
                                                        fontWeight: 700, cursor: "pointer", padding: 0,
                                                        fontSize: 13, textDecoration: "underline",
                                                        textUnderlineOffset: 3 }}>
                                                    Sign in
                                                </button>
                                            </p>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
