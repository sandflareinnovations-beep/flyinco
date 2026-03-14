"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Plane, Clock, Briefcase,
  ArrowRight, Star, ChevronRight, ChevronDown, Search
} from "lucide-react";

// ── Flyinco Brand ──
const B = { primary: "#2E0A57", accent: "#6C2BD9", light: "#EDE9FE" };

const ROUTE = {
  from: { code: "RUH", city: "Riyadh", country: "Saudi Arabia" },
  to: { code: "COK", city: "Cochin", country: "India" },
  date: "09 March 2026",
  price: 2000,
  airline: "Saudia Airlines",
  airlineLogo: "",
  flight: "",
  duration: "7h 15m",
  baggage: "2 PC / 30 kg",
  layover: "",
  flightRules: "",
  flightDetails: "",
  departureTime: "11:35 AM",
  arrivalTime: "18:50 PM",
};

function Pill({ children, bg = B.light, color = B.primary }: any) {
  return (
    <span style={{
      background: bg, color, fontSize: 11, fontWeight: 700,
      padding: "4px 12px", borderRadius: 999,
      display: "inline-flex", alignItems: "center", gap: 5,
      letterSpacing: "0.02em", border: `1px solid ${color}22`
    }}>
      {children}
    </span>
  );
}

import { useQuery } from "@tanstack/react-query";
import { flyApi } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  const { data: sectors } = useQuery({
    queryKey: ["sectors"],
    queryFn: flyApi.sectors.list,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Debug: Log fetched sectors to console
  useEffect(() => {
    if (sectors) {
      console.log("[Home] Fetched Sectors:", sectors);
    }
  }, [sectors]);

  // Show all open sectors on the home page
  const openSectors = (sectors || []).filter(s => s.bookingStatus !== "CLOSED" && s.remainingSeats > 0);
  const featuredSector = openSectors.length > 0 ? openSectors[0] : null;

  // Selected route for search card
  const [selectedSector, setSelectedSector] = useState<typeof openSectors[0] | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFlightModal, setSelectedFlightModal] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-select first route when data loads
  useEffect(() => {
    if (openSectors.length > 0 && !selectedSector) {
      setSelectedSector(openSectors[0]);
    }
  }, [openSectors.length]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeSector = selectedSector || featuredSector;

  const dynamicRoute = activeSector ? {
    from: { code: activeSector.originCode, city: activeSector.originCity, country: "" },
    to: { code: activeSector.destinationCode, city: activeSector.destinationCity, country: "" },
    date: activeSector.departureDate || ROUTE.date,
    price: activeSector.price,
    airline: activeSector.airline,
    airlineLogo: activeSector.airlineLogo,
    flight: activeSector.flightNumber,
    duration: activeSector.duration,
    baggage: activeSector.baggage || ROUTE.baggage,
    layover: activeSector.layover,
    flightRules: activeSector.flightRules,
    flightDetails: activeSector.flightDetails,
    departureTime: activeSector.departureTime || ROUTE.departureTime,
    arrivalTime: activeSector.arrivalTime || ROUTE.arrivalTime,
  } : ROUTE;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#fff", minHeight: "100vh" }}>

      {/* ═══════════════════════════════════════════
                HERO — full viewport with layered depth
            ═══════════════════════════════════════════ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "-64px" }}>

        {/* Background image */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image src="/hero.png" alt="Flyinco hero" fill className="object-cover" priority quality={90} />
          {/* Multi-layer gradient overlay for depth + contrast */}
          <div style={{
            position: "absolute", inset: 0,
            background: `
                            linear-gradient(
                                135deg,
                                rgba(46,10,87,0.90) 0%,
                                rgba(46,10,87,0.75) 40%,
                                rgba(108,43,217,0.55) 75%,
                                rgba(46,10,87,0.85) 100%
                            )
                        `
          }} />
          {/* Bottom fade to white for section transition */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 160,
            background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.35) 100%)"
          }} />
        </div>

        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: "15%", right: "8%", width: 320, height: 320,
          borderRadius: "50%", background: "rgba(108,43,217,0.18)",
          filter: "blur(80px)", zIndex: 1, pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: "20%", left: "5%", width: 250, height: 250,
          borderRadius: "50%", background: "rgba(255,255,255,0.06)",
          filter: "blur(60px)", zIndex: 1, pointerEvents: "none"
        }} />

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1120, margin: "0 auto", padding: "140px 24px 60px", width: "100%" }}>

          {/* Top badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.22)", borderRadius: 999,
              padding: "6px 16px 6px 10px", marginBottom: 28
            }}>
              <span style={{
                background: "#10B981", borderRadius: "50%",
                width: 8, height: 8, display: "inline-block"
              }} />
              <span style={{ color: "rgba(255,255,255,0.92)", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>
                BEST FARES AVAILABLE NOW — RUH → COK
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <h1 style={{
              fontSize: "clamp(36px, 6vw, 68px)", fontWeight: 900,
              color: "#ffffff", lineHeight: 1.06, letterSpacing: "-0.04em",
              marginBottom: 20, maxWidth: 700
            }}>
              Find the Best<br />
              <span style={{ color: "#C4B5FD" }}>Flight Deals</span>
            </h1>
            <p style={{
              fontSize: "clamp(15px, 2vw, 19px)", color: "rgba(255,255,255,0.72)",
              marginBottom: 48, maxWidth: 520, lineHeight: 1.6, fontWeight: 400
            }}>
              Fly from Riyadh to Kochi with exclusive agency fares —
              limited seats, unbeatable prices.
            </p>
          </motion.div>

          {/* ── Search Card ── */}
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <div style={{
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(24px)",
              borderRadius: 20,
              padding: "6px",
              boxShadow: "0 32px 80px rgba(46,10,87,0.35), 0 8px 24px rgba(0,0,0,0.15)",
              maxWidth: 820,
              border: "1px solid rgba(255,255,255,0.8)",
              position: "relative",
            }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>

                {/* FROM/TO — Clickable dropdown trigger */}
                <div
                  ref={dropdownRef}
                  style={{ position: "relative", flex: "1 1 320px", display: "flex", gap: 4 }}
                >
                  {/* FROM field */}
                  <div
                    onClick={() => setDropdownOpen(o => !o)}
                    style={{
                      flex: 1, padding: "16px 20px", borderRadius: 14,
                      background: dropdownOpen ? B.light : "#F9FAFB",
                      cursor: "pointer",
                      border: dropdownOpen ? `2px solid ${B.accent}` : "2px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                      🛫 FROM
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#111827", letterSpacing: "-0.04em" }}>
                      {dynamicRoute.from.code}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      {dynamicRoute.from.city} <ChevronDown size={12} color={B.accent} />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: "0 2px" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: "1.5px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", background: "white" }}>
                      <ArrowRight size={11} color="#9CA3AF" />
                    </div>
                  </div>

                  {/* TO field */}
                  <div
                    onClick={() => setDropdownOpen(o => !o)}
                    style={{
                      flex: 1, padding: "16px 20px", borderRadius: 14,
                      background: dropdownOpen ? B.light : "#F9FAFB",
                      cursor: "pointer",
                      border: dropdownOpen ? `2px solid ${B.accent}` : "2px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                      🛬 TO
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#111827", letterSpacing: "-0.04em" }}>
                      {dynamicRoute.to.code}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      {dynamicRoute.to.city} <ChevronDown size={12} color={B.accent} />
                    </div>
                  </div>

                  {/* DROPDOWN */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                          background: "#fff",
                          borderRadius: 18,
                          boxShadow: "0 20px 60px rgba(46,10,87,0.18), 0 4px 16px rgba(0,0,0,0.08)",
                          border: `1px solid ${B.accent}33`,
                          overflow: "hidden",
                          zIndex: 100,
                        }}
                      >
                        {/* Dropdown Header */}
                        <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid #F3F0FF" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Search size={14} color={B.accent} />
                            <span style={{ fontWeight: 800, fontSize: 13, color: B.primary }}>Available Routes</span>
                            <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>{openSectors.length} route{openSectors.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>

                        {openSectors.length === 0 ? (
                          <div style={{ padding: "24px 20px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                            No routes available right now.
                          </div>
                        ) : (
                          <div style={{ maxHeight: 340, overflowY: "auto" }}>
                            {openSectors.map((s, i) => {
                              const isSelected = activeSector?.id === s.id;
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => { setSelectedSector(s); setDropdownOpen(false); }}
                                  style={{
                                    padding: "14px 20px",
                                    cursor: "pointer",
                                    background: isSelected ? "#F3F0FF" : "#fff",
                                    borderBottom: i < openSectors.length - 1 ? "1px solid #F9F8FF" : "none",
                                    transition: "background 0.12s ease",
                                    display: "flex", alignItems: "center", gap: 14,
                                  }}
                                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA"; }}
                                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "#fff"; }}
                                >
                                  {/* Airline logo */}
                                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F3F0FF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                    {s.airlineLogo ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={s.airlineLogo} alt={s.airline} width={32} height={32} style={{ objectFit: "contain" }} />
                                    ) : (
                                      <Plane size={18} color={B.accent} />
                                    )}
                                  </div>

                                  {/* Route info */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                      <span style={{ fontWeight: 900, fontSize: 16, color: B.primary, letterSpacing: "-0.03em" }}>{s.originCode}</span>
                                      <ArrowRight size={12} color="#C4B5FD" />
                                      <span style={{ fontWeight: 900, fontSize: 16, color: B.primary, letterSpacing: "-0.03em" }}>{s.destinationCode}</span>
                                      {isSelected && (
                                        <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: B.accent, background: "#EDE9FE", padding: "2px 8px", borderRadius: 999 }}>Selected</span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                      <span>{s.originCity} → {s.destinationCity}</span>
                                      {s.departureDate && <span>📅 {new Date(s.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                                      <span>✈ {s.airline} ({s.flightNumber})</span>
                                      {s.layover && <span>⏱ {s.layover}</span>}
                                    </div>
                                  </div>

                                  {/* Price */}
                                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <div style={{ fontWeight: 900, fontSize: 18, color: B.primary, letterSpacing: "-0.03em" }}>SAR {s.price.toLocaleString()}</div>
                                    <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>{s.remainingSeats} seats left</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* DATE */}
                <div style={{
                  flex: "1 1 160px", padding: "16px 20px",
                  background: "#FEF3C7",
                  borderRadius: 14,
                  cursor: "default",
                  border: "2px solid #F59E0B",
                  boxShadow: "0 8px 16px rgba(245, 158, 11, 0.2)"
                }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: "#D97706", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                    📅 TRAVEL DATE
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#92400E", letterSpacing: "-0.04em" }}>
                    {activeSector?.departureDate ? activeSector.departureDate.split(" ").slice(0, 2).join(" ") : "09 March"}
                  </div>
                  <div style={{ fontSize: 12, color: "#B45309", marginTop: 2, fontWeight: 700 }}>
                    {activeSector?.departureDate ? activeSector.departureDate.split(" ").slice(2).join(" ") : "2026"} · <span style={{ background: "#FDE68A", padding: "2px 6px", borderRadius: 4 }}>One way</span>
                  </div>
                </div>

                {/* Search CTA */}
                <button
                  onClick={() => router.push(`/routes/${activeSector ? activeSector.id : "ruh-cok"}/flights`)}
                  style={{
                    flex: "0 0 auto",
                    background: `linear-gradient(135deg, ${B.primary} 0%, ${B.accent} 100%)`,
                    color: "white", border: "none", borderRadius: 14,
                    padding: "0 32px", cursor: "pointer",
                    fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em",
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "all 0.2s ease",
                    minWidth: 140, justifyContent: "center",
                    boxShadow: `0 8px 24px ${B.primary}55`,
                    minHeight: 72,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = `0 12px 32px ${B.primary}70`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 8px 24px ${B.primary}55`;
                  }}
                >
                  Search Flights
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Route notice */}
              <p style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", padding: "10px 20px 12px", fontWeight: 500 }}>
                ✈ {openSectors.length > 0
                  ? <>{openSectors.length} route{openSectors.length > 1 ? "s" : ""} available · Click <strong style={{ color: B.primary }}>FROM / TO</strong> to browse all</>
                  : <>Fares available for <strong style={{ color: B.primary }}>Riyadh (RUH) → Cochin (COK)</strong> · More routes coming soon</>}
              </p>
            </div>
          </motion.div>

          {/* Trust signals */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px", marginTop: 36 }}>
              {[
                { label: "4.9/5 Rated Agency", icon: <Star size={13} fill="#FBBF24" color="#FBBF24" /> },
                { label: "Instant Approval", icon: <ShieldCheck size={13} color="#86EFAC" /> },
                { label: "Verified B2B Fares", icon: <ShieldCheck size={13} color="#93C5FD" /> },
              ].map(({ label, icon }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.80)", fontSize: 13, fontWeight: 500 }}>
                  {icon} {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
                FEATURE BAR
            ═══════════════════════════════════════════ */}
      <section style={{ background: "#fff", borderTop: "1px solid #F3F0FF", borderBottom: "1px solid #F3F0FF" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "16px 48px" }}>
            {[
              { Icon: ShieldCheck, label: "Verified Best Fares", color: "#10B981" },
              { Icon: Plane, label: "Direct & 1-Stop Options", color: B.accent },
              { Icon: ShieldCheck, label: "Instant Approval", color: "#F59E0B" },
              { Icon: Briefcase, label: "Corporate B2B Rates", color: "#3B82F6" },
            ].map(({ Icon, label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 9, color: "#374151", fontSize: 13, fontWeight: 600 }}>
                <Icon size={16} color={color} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
                ALL AVAILABLE FARE CARDS
            ═══════════════════════════════════════════ */}
      <section style={{ background: "#F7F7FB", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4 }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <Pill>🔥 {openSectors.length > 0 ? `${openSectors.length} Available Route${openSectors.length > 1 ? "s" : ""}` : "Limited Time Offer"}</Pill>
            <h2 style={{
              fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900,
              color: "#0F0A1A", letterSpacing: "-0.04em",
              marginTop: 14, marginBottom: 8
            }}>
              Featured Routes
            </h2>
            <p style={{ color: "#6B7280", fontSize: 15 }}>
              Exclusive fares. Unbeatable prices. Book before seats run out.
            </p>
          </motion.div>

          {/* All Sector Cards */}
          {openSectors.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 860, margin: "0 auto 48px" }}>
              {openSectors.map((s, idx) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: idx * 0.08, duration: 0.4 }}
                >
                  <div style={{
                    background: "#F9FAFB",
                    borderRadius: 4,
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    position: "relative",
                    padding: "10px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8
                  }}>
                    {idx === 0 && (
                      <div style={{ display: "flex", marginBottom: -6 }}>
                        <div style={{
                          background: B.primary,
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}>
                          Flyinco Special Fare
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      
                      {/* Airline Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80, flexShrink: 0 }}>
                        <div style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
                          {s.airlineLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.airlineLogo} alt={s.airline} style={{ maxWidth: 60, maxHeight: 32, objectFit: "contain" }} />
                          ) : (
                            <Plane size={22} color={B.accent} />
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "#333", textAlign: "center", lineHeight: 1.2 }}>{s.airline}</span>
                        <span style={{ fontSize: 10, color: "#666", textAlign: "center", marginTop: 2 }}>{s.flightNumber}</span>
                      </div>

                      {/* Departure Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
                        <span style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>{s.originCity} ({s.originCode})</span>
                        <span style={{ fontSize: 20, fontWeight: 700, color: "#111", lineHeight: 1.1 }}>{s.departureTime || "--:--"}</span>
                        <span style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                          {s.departureDate ? new Date(s.departureDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).replace(',', '') : "--"}
                        </span>
                      </div>

                      {/* Duration Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 100px", minWidth: 100, maxWidth: 160 }}>
                        <span style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{s.duration}</span>
                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", border: "1.5px solid #9CA3AF", background: "transparent", flexShrink: 0 }}></div>
                          <div style={{ flex: 1, height: 1.5, background: "#9CA3AF" }}></div>
                          <svg width="6" height="8" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0, marginLeft: -1 }}>
                            <path d="M1 1L5 5L1 9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <Briefcase size={12} color="#374151" />
                          <span style={{ fontSize: 11, color: "#111", fontWeight: 600 }}>{s.baggage || "40KG"}</span>
                        </div>
                      </div>

                      {/* Arrival Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
                        <span style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>{s.destinationCity} ({s.destinationCode})</span>
                        <span style={{ fontSize: 20, fontWeight: 700, color: "#111", lineHeight: 1.1 }}>{s.arrivalTime || "--:--"}</span>
                        <span style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                          {s.departureDate ? new Date(s.departureDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).replace(',', '') : "--"}
                        </span>
                      </div>

                      {/* Price Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 110 }}>
                        <span style={{ background: "#4B5563", color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, marginBottom: 4 }}>
                          {s.flightRules === "Refundable" ? "Refundable" : "NonRefundable"}
                        </span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: B.primary, display: "flex", alignItems: "baseline", gap: 2 }}>
                          <span style={{ fontSize: 12 }}>SAR </span>{s.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <span style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                          NetFare - {s.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Action Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
                        <button
                          onClick={() => router.push(`/routes/${s.id}/flights`)}
                          style={{
                            background: B.primary,
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            padding: "6px 24px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            width: "100%",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#1D063A"}
                          onMouseLeave={e => e.currentTarget.style.background = B.primary}
                        >
                          BOOK
                        </button>
                        <button
                          onClick={() => setSelectedFlightModal(s)} 
                          style={{
                            background: "transparent",
                            border: "none",
                            color: B.primary,
                            fontSize: 11,
                            fontWeight: 500,
                            cursor: "pointer",
                            marginTop: 6
                          }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                        >
                          Flight Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Fallback single card when no live data */}
          {openSectors.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.45 }}
              style={{ maxWidth: 780, margin: "0 auto" }}
            >
              <div style={{
                background: "#F9FAFB",
                borderRadius: 4,
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                position: "relative",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 12
              }}>
                <div style={{ display: "flex", marginBottom: -6 }}>
                  <div style={{
                    background: B.primary,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 500,
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}>
                    Flyinco Special Fare
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  
                  {/* Airline Section */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80, flexShrink: 0 }}>
                    <div style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
                      {dynamicRoute.airlineLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={dynamicRoute.airlineLogo} alt={dynamicRoute.airline} style={{ maxWidth: 60, maxHeight: 32, objectFit: "contain" }} />
                      ) : (
                        <Plane size={22} color={B.accent} />
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "#333", textAlign: "center", lineHeight: 1.2 }}>{dynamicRoute.airline}</span>
                    <span style={{ fontSize: 10, color: "#666", textAlign: "center", marginTop: 2 }}>{dynamicRoute.flight}</span>
                  </div>

                  {/* Departure Section */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
                    <span style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>{dynamicRoute.from.city} ({dynamicRoute.from.code})</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#111", lineHeight: 1.1 }}>{dynamicRoute.departureTime || "--:--"}</span>
                    <span style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                      Mon Mar 16 2026
                    </span>
                  </div>

                  {/* Duration Section */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 100px", minWidth: 100, maxWidth: 160 }}>
                    <span style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{dynamicRoute.duration}</span>
                    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", border: "1.5px solid #9CA3AF", background: "transparent", flexShrink: 0 }}></div>
                      <div style={{ flex: 1, height: 1.5, background: "#9CA3AF" }}></div>
                      <svg width="6" height="8" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0, marginLeft: -1 }}>
                        <path d="M1 1L5 5L1 9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Briefcase size={12} color="#374151" />
                      <span style={{ fontSize: 11, color: "#111", fontWeight: 600 }}>{dynamicRoute.baggage || "40KG"}</span>
                    </div>
                  </div>

                  {/* Arrival Section */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
                    <span style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>{dynamicRoute.to.city} ({dynamicRoute.to.code})</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#111", lineHeight: 1.1 }}>{dynamicRoute.arrivalTime || "--:--"}</span>
                    <span style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                      Mon Mar 16 2026
                    </span>
                  </div>

                  {/* Price Section */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 110 }}>
                    <span style={{ background: "#4B5563", color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, marginBottom: 4 }}>
                      NonRefundable
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: B.primary, display: "flex", alignItems: "baseline", gap: 2 }}>
                      <span style={{ fontSize: 12 }}>SAR </span>{dynamicRoute.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                      NetFare - {dynamicRoute.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Action Section */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
                    <button
                      onClick={() => router.push(`/routes/${dynamicRoute && activeSector ? activeSector.id : "ruh-cok"}/flights`)}
                      style={{
                        background: B.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "6px 24px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        width: "100%",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#1D063A"}
                      onMouseLeave={e => e.currentTarget.style.background = B.primary}
                    >
                      BOOK
                    </button>
                    <button
                      onClick={() => setSelectedFlightModal(dynamicRoute)} 
                      style={{
                        background: "transparent",
                        border: "none",
                        color: B.primary,
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: "pointer",
                        marginTop: 6
                      }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                    >
                      Flight Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Flight Details Modal */}
      {selectedFlightModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex",
          alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)"
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640,
              boxShadow: "0 24px 48px rgba(0,0,0,0.2)", overflow: "hidden", position: "relative"
            }}
          >
            {/* Header */}
            <div style={{ background: B.primary, padding: "20px 24px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>Flight Details</span>
              <button 
                onClick={() => setSelectedFlightModal(null)} 
                style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            {/* Body */}
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, borderBottom: "1px solid #E5E7EB", paddingBottom: 16 }}>
                {selectedFlightModal.airlineLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedFlightModal.airlineLogo} alt="Airline" style={{ maxHeight: 40, objectFit: "contain" }} />
                ) : (
                  <Plane size={32} color={B.accent} />
                )}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{selectedFlightModal.airline}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>Flight {selectedFlightModal.flightNumber || selectedFlightModal.flight}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#111" }}>{selectedFlightModal.departureTime || "--:--"}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>{selectedFlightModal.originCity || selectedFlightModal.from?.city} ({selectedFlightModal.originCode || selectedFlightModal.from?.code})</div>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                    {selectedFlightModal.departureDate ? new Date(selectedFlightModal.departureDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).replace(',', '') : (selectedFlightModal.date || "Mon Mar 16 2026")}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 16px" }}>
                  <span style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{selectedFlightModal.duration}</span>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", border: "2px solid #9CA3AF", background: "transparent" }}></div>
                    <div style={{ flex: 1, height: 2, background: "#9CA3AF" }}></div>
                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ marginLeft: -1 }}><path d="M1 1L5 5L1 9" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{selectedFlightModal.layover ? `${selectedFlightModal.layover} Stop(s)` : "Direct"}</span>
                </div>

                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#111" }}>{selectedFlightModal.arrivalTime || "--:--"}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>{selectedFlightModal.destinationCity || selectedFlightModal.to?.city} ({selectedFlightModal.destinationCode || selectedFlightModal.to?.code})</div>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                    {selectedFlightModal.departureDate ? new Date(selectedFlightModal.departureDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).replace(',', '') : (selectedFlightModal.date || "Mon Mar 16 2026")}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#F9FAFB", padding: 16, borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 2 }}>Baggage Allowance</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111", display: "flex", alignItems: "center", gap: 6 }}>
                    <Briefcase size={14} color={B.accent} /> {selectedFlightModal.baggage || "40KG"}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 2 }}>Flight Rules</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{selectedFlightModal.flightRules === "Refundable" ? "Refundable" : "NonRefundable"}</span>
                </div>
              </div>
              
              {selectedFlightModal.flightDetails && (
                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 8 }}>Additional Information</h4>
                  <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, background: "#F3F4F6", padding: 12, borderRadius: 6, whiteSpace: "pre-wrap" }}>
                    {selectedFlightModal.flightDetails}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

// ── Helper Components ──
function SearchField({ label, code, name, sub, icon }: { label: string; code: string; name: string; sub: string; icon: string }) {
  return (
    <div style={{
      flex: "1 1 160px", padding: "16px 20px", borderRadius: 14,
      background: "#F9FAFB", cursor: "default",
      minWidth: 130
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: "#111827", letterSpacing: "-0.04em" }}>
        {code}
      </div>
      <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, marginTop: 2 }}>{name}</div>
      <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{sub}</div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: "0 2px" }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        border: "1.5px solid #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "white"
      }}>
        <ArrowRight size={11} color="#9CA3AF" />
      </div>
    </div>
  );
}
