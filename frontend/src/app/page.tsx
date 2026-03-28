"use client";
import { PiShieldCheck, PiAirplaneTilt, PiClock, PiBriefcase, PiArrowRight, PiCaretRight, PiCaretDown, PiMagnifyingGlass, PiDownloadSimple, PiAirplaneTakeoff, PiAirplaneLanding, PiCalendarBlank, PiUsers, PiLightning, PiLock, PiKey, PiCheckCircle, PiGlobe } from "react-icons/pi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { BookingReceipt } from "@/components/admin/booking-receipt";

// ── Flyinco Brand ──
const B = { primary: "#0A0E1A", accent: "#7C3AED", light: "rgba(124,58,237,0.12)" };
const GRADIENT = "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)";

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

function Pill({ children, bg = B.light, color = "#C084FC" }: any) {
  return (
    <span style={{
      background: bg, color, fontSize: 11, fontWeight: 700,
      padding: "4px 14px 4px 8px", borderRadius: 999,
      display: "inline-flex", alignItems: "center", gap: 6,
      letterSpacing: "0.02em", border: "1px solid rgba(124,58,237,0.3)"
    }}>
      {children}
    </span>
  );
}

import { useQuery } from "@tanstack/react-query";
import { flyApi } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  const { data: sectors, isLoading: sectorsLoading } = useQuery({
    queryKey: ["sectors"],
    queryFn: () => flyApi.sectors.list(),
  });

  // Show only truly open sectors on the home page
  const openSectors = (sectors || []).filter((s: any) => 
    s.bookingStatus !== "CLOSED" && 
    s.bookingStatus !== "SOLD" && 
    s.remainingSeats > 0
  );
  const featuredSector = openSectors.length > 0 ? openSectors[0] : null;

  // Selected route for search card
  const [selectedSector, setSelectedSector] = useState<typeof openSectors[0] | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFlightModal, setSelectedFlightModal] = useState<any>(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [selectedSectorForItinerary, setSelectedSectorForItinerary] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-select first route when data loads
  useEffect(() => {
    if (openSectors.length > 0 && !selectedSector) {
      setSelectedSector(openSectors[0]);
    }
  }, [openSectors, selectedSector]);

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
    departureDate: activeSector.departureDate,
    arrivalDate: activeSector.arrivalDate,
  } : null;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0A0E1A", minHeight: "100vh" }}>

      {/* ═══════════════════════════════════════════
                HERO — full viewport with layered depth
            ═══════════════════════════════════════════ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "-64px" }}>

        {/* Background image */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image src="/hero.jpg" alt="Flyinco hero" fill className="object-cover" style={{ objectPosition: "60% center" }} priority quality={90} />
          {/* Multi-layer gradient overlay for depth + contrast */}
          <div style={{
            position: "absolute", inset: 0,
            background: `
                            linear-gradient(
                                135deg,
                                rgba(10,14,26,0.88) 0%,
                                rgba(10,14,26,0.70) 40%,
                                rgba(124,58,237,0.45) 75%,
                                rgba(10,14,26,0.82) 100%
                            )
                        `
          }} />
          {/* Bottom fade to dark for section transition */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 160,
            background: "linear-gradient(to bottom, transparent, rgba(10,14,26,0.4) 60%, #0A0E1A 100%)"
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
              background: "rgba(124,58,237,0.22)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(124,58,237,0.45)", borderRadius: 999,
              padding: "6px 16px 6px 10px", marginBottom: 28
            }}>
              <span style={{
                background: "#10B981", borderRadius: "50%",
                width: 8, height: 8, display: "inline-block"
              }} />
              <span style={{ color: "rgba(255,255,255,0.92)", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>
                {openSectors.length > 0
                  ? `CHARTER FLIGHT OPEN · ${openSectors[0].originCode} → ${openSectors[0].destinationCode}`
                  : "CHARTERED FLIGHTS PORTAL"}
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
              Your Gateway to<br />
              <span style={{ color: "#C4B5FD" }}>Chartered Flights</span>
            </h1>
            <p style={{
              fontSize: "clamp(15px, 2vw, 19px)", color: "rgba(255,255,255,0.72)",
              marginBottom: 48, maxWidth: 520, lineHeight: 1.6, fontWeight: 400
            }}>
              {openSectors.length > 0
                ? `Charter seats from ${openSectors[0].originCity} to ${openSectors[0].destinationCity}. Exclusive block fares, agency-only pricing, instant confirmation.`
                : "Access exclusive chartered flight blocks with agency-only pricing, guaranteed seats and instant confirmation."}
            </p>
          </motion.div>

          {/* ── PiMagnifyingGlass Card ── */}
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <div style={{
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(24px)",
              borderRadius: 24,
              padding: "6px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 8px 24px rgba(124,58,237,0.25)",
              maxWidth: 820,
              border: "1px solid rgba(255,255,255,0.12)",
              position: "relative",
            }}>
              {dynamicRoute ? (
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
                      background: dropdownOpen ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.07)",
                      cursor: "pointer",
                      border: dropdownOpen ? "2px solid #7C3AED" : "2px solid rgba(255,255,255,0.08)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <PiAirplaneTakeoff size={13} color="rgba(255,255,255,0.7)" /> FROM
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.04em" }}>
                      {dynamicRoute.from.code}
                    </div>
                    <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      {dynamicRoute.from.city} <PiCaretDown size={12} color="rgba(255,255,255,0.6)" />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: "0 2px" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)" }}>
                      <PiArrowRight size={11} color="rgba(255,255,255,0.7)" />
                    </div>
                  </div>

                  {/* TO field */}
                  <div
                    onClick={() => setDropdownOpen(o => !o)}
                    style={{
                      flex: 1, padding: "16px 20px", borderRadius: 14,
                      background: dropdownOpen ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.07)",
                      cursor: "pointer",
                      border: dropdownOpen ? "2px solid #7C3AED" : "2px solid rgba(255,255,255,0.08)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <PiAirplaneLanding size={13} color="rgba(255,255,255,0.7)" /> TO
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.04em" }}>
                      {dynamicRoute.to.code}
                    </div>
                    <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      {dynamicRoute.to.city} <PiCaretDown size={12} color="rgba(255,255,255,0.6)" />
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
                          background: "#1a1f35",
                          borderRadius: 18,
                          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                          border: "1px solid rgba(124,58,237,0.3)",
                          overflow: "hidden",
                          zIndex: 100,
                        }}
                      >
                        {/* Dropdown Header */}
                        <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <PiMagnifyingGlass size={14} color="rgba(255,255,255,0.8)" />
                            <span style={{ fontWeight: 800, fontSize: 13, color: "#E2E8F0" }}>Charter Routes</span>
                            <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>{openSectors.length} flight{openSectors.length !== 1 ? "s" : ""} open</span>
                          </div>
                        </div>

                        {openSectors.length === 0 ? (
                          <div style={{ padding: "24px 20px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                            No routes available right now.
                          </div>
                        ) : (
                          <div style={{ maxHeight: 340, overflowY: "auto" }}>
                            {openSectors.map((s: any, i: number) => {
                              const isSelected = activeSector?.id === s.id;
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => { setSelectedSector(s); setDropdownOpen(false); }}
                                  style={{
                                    padding: "14px 20px",
                                    cursor: "pointer",
                                    background: isSelected ? "rgba(124,58,237,0.15)" : "transparent",
                                    borderBottom: i < openSectors.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                                    transition: "background 0.12s ease",
                                    display: "flex", alignItems: "center", gap: 14,
                                  }}
                                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; }}
                                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                                >
                                  {/* Airline logo */}
                                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                    {s.airlineLogo ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={s.airlineLogo} alt={s.airline} width={32} height={32} style={{ objectFit: "contain" }} />
                                    ) : (
                                      <PiAirplaneTilt size={18} color="rgba(255,255,255,0.85)" />
                                    )}
                                  </div>

                                  {/* Route info */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                      <span style={{ fontWeight: 900, fontSize: 16, color: "#FFFFFF", letterSpacing: "-0.03em" }}>{s.originCode}</span>
                                      <PiArrowRight size={12} color="rgba(255,255,255,0.5)" />
                                      <span style={{ fontWeight: 900, fontSize: 16, color: "#FFFFFF", letterSpacing: "-0.03em" }}>{s.destinationCode}</span>
                                      {isSelected && (
                                        <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#A78BFA", background: "rgba(124,58,237,0.2)", padding: "2px 8px", borderRadius: 999 }}>Selected</span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#94A3B8", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                      <span>{s.originCity} → {s.destinationCity}</span>
                                      <span style={{display: "flex", alignItems:"center", gap:3}}><PiCalendarBlank size={12}/> {s.departureDate && new Date(s.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                      <span style={{display: "flex", alignItems:"center", gap:3}}><PiAirplaneTilt size={12}/> {s.airline} ({s.flightNumber})</span>
                                      {s.layover && <span style={{display: "flex", alignItems:"center", gap:3}}><PiClock size={12}/> {s.layover}</span>}
                                    </div>
                                  </div>

                                  {/* Price */}
                                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <div style={{ fontWeight: 900, fontSize: 18, color: "#C084FC", letterSpacing: "-0.03em" }}>SAR {s.price.toLocaleString()}</div>
                                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500 }}>{s.remainingSeats} seats left</div>
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
                  background: "rgba(124,58,237,0.15)",
                  borderRadius: 14,
                  cursor: "default",
                  border: "2px solid #7C3AED",
                  boxShadow: "0 8px 16px rgba(124,58,237,0.25)"
                }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: "#A78BFA", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <PiCalendarBlank size={13} color="rgba(255,255,255,0.8)" /> TRAVEL DATE
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.04em" }}>
                    {activeSector?.departureDate ? activeSector.departureDate.split(" ").slice(0, 2).join(" ") : "09 March"}
                  </div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, fontWeight: 700 }}>
                    {activeSector?.departureDate ? activeSector.departureDate.split(" ").slice(2).join(" ") : "2026"} · <span style={{ background: "rgba(124,58,237,0.25)", color: "#C084FC", padding: "2px 6px", borderRadius: 4 }}>One way</span>
                  </div>
                </div>

                {/* PiMagnifyingGlass CTA */}
                <button
                  onClick={() => router.push(`/routes/${activeSector ? activeSector.id : "ruh-cok"}/flights`)}
                  style={{
                    flex: "0 0 auto",
                    background: GRADIENT,
                    color: "white", border: "none", borderRadius: 14,
                    padding: "0 32px", cursor: "pointer",
                    fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em",
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "all 0.2s ease",
                    minWidth: 140, justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(124,58,237,0.45)",
                    minHeight: 72,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(124,58,237,0.65)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.45)";
                  }}
                >
                  <PiMagnifyingGlass size={20} />
                  <span>SEARCH</span>
                </button>
              </div>
              ) : sectorsLoading ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px" }}>
                  {/* Loading skeleton for search card */}
                  <div style={{ flex: "1 1 320px", display: "flex", gap: 4 }}>
                    <div style={{ flex: 1, padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.07)" }}>
                      <div style={{ width: 40, height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ width: 60, height: 24, background: "rgba(255,255,255,0.08)", borderRadius: 6, marginBottom: 4 }} />
                      <div style={{ width: 80, height: 12, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", padding: "0 2px" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                    </div>
                    <div style={{ flex: 1, padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.07)" }}>
                      <div style={{ width: 40, height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ width: 60, height: 24, background: "rgba(255,255,255,0.08)", borderRadius: 6, marginBottom: 4 }} />
                      <div style={{ width: 80, height: 12, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ flex: "0 0 140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "100%", height: 72, background: "rgba(124,58,237,0.2)", borderRadius: 14 }} />
                  </div>
                </div>
              ) : (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Charter Status
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                    No Charter Flights Open
                  </div>
                  <div style={{ fontSize: 14, color: "#94A3B8", marginTop: 8, maxWidth: 400, margin: "8px auto 0" }}>
                    No charter blocks are available right now. Contact us for group bookings or check back soon for new routes.
                  </div>
                </div>
              )}

              {/* Route notice */}
              <p style={{ textAlign: "center", fontSize: 11, color: "#64748B", padding: "10px 20px 12px", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <PiAirplaneTilt size={14} color="rgba(255,255,255,0.6)" /> {openSectors.length > 0
                  ? <>{openSectors.length} charter route{openSectors.length > 1 ? "s" : ""} open · Click <strong style={{ color: "#A78BFA" }}>FROM / TO</strong> to select</>
                  : <>Charter route: <strong style={{ color: "#A78BFA" }}>Riyadh (RUH) → Cochin (COK)</strong> · More routes coming soon</>}
              </p>
            </div>
          </motion.div>

          {/* Trust signals */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 28px", marginTop: 36 }}>
              {[
                { label: "Group Bookings Welcome", Icon: PiUsers },
                { label: "Instant Confirmation", Icon: PiLightning },
                { label: "Verified Charter Rates", Icon: PiShieldCheck },
              ].map(({ label, Icon }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 9, color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 10px rgba(255,255,255,0.08)",
                    flexShrink: 0,
                  }}>
                    <Icon size={14} color="rgba(255,255,255,0.9)" />
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
                FEATURE BAR
            ═══════════════════════════════════════════ */}
      <section style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "16px 44px" }}>
            {[
              { Icon: PiCheckCircle, label: "Guaranteed Block Seats", favicon: false },
              { Icon: PiAirplaneTilt, label: "Charter & Group Bookings", favicon: true },
              { Icon: PiLightning, label: "Instant Confirmation", favicon: false },
              { Icon: PiKey, label: "Agency-Only Pricing", favicon: false },
            ].map(({ Icon, label, favicon }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, color: "#E2E8F0", fontSize: 13, fontWeight: 600 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: favicon ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.07)",
                  border: favicon ? "1px solid rgba(124,58,237,0.35)" : "1px solid rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: favicon ? "0 0 10px rgba(124,58,237,0.2)" : "0 0 8px rgba(255,255,255,0.06)",
                }}>
                  <Icon size={14} color="rgba(255,255,255,0.85)" />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
                ALL AVAILABLE FARE CARDS
            ═══════════════════════════════════════════ */}
      <section style={{ background: "#0D1120", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4 }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <Pill>{openSectors.length > 0 ? `${openSectors.length} Charter Flight${openSectors.length > 1 ? "s" : ""} Open` : "Charter Flights Portal"}</Pill>
            <h2 style={{
              fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900,
              color: "#FFFFFF", letterSpacing: "-0.04em",
              marginTop: 14, marginBottom: 8
            }}>
              Available Charter Flights
            </h2>
            <p style={{ color: "#94A3B8", fontSize: 15 }}>
              Block-seat charters with agency-only pricing. Secure your seats before they close.
            </p>
          </motion.div>

          {/* Loading skeleton for fare cards */}
          {sectorsLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 860, margin: "0 auto 48px" }}>
              {[1, 2].map((i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)",
                  padding: "24px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16
                }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
                    <div style={{ width: 60, height: 40, background: "rgba(255,255,255,0.08)", borderRadius: 8, marginBottom: 8 }} />
                    <div style={{ width: 80, height: 12, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
                    <div>
                      <div style={{ width: 100, height: 12, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ width: 70, height: 28, background: "rgba(255,255,255,0.08)", borderRadius: 6 }} />
                    </div>
                    <div style={{ width: 60, height: 2, background: "rgba(255,255,255,0.08)" }} />
                    <div>
                      <div style={{ width: 100, height: 12, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ width: 70, height: 28, background: "rgba(255,255,255,0.08)", borderRadius: 6 }} />
                    </div>
                  </div>
                  <div style={{ width: 80, height: 32, background: "rgba(255,255,255,0.08)", borderRadius: 6 }} />
                </div>
              ))}
            </div>
          )}

          {/* All Sector Cards */}
          {!sectorsLoading && openSectors.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 860, margin: "0 auto 48px" }}>
              {openSectors.map((s: any, idx: number) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: idx * 0.08, duration: 0.4 }}
                >
                  <div
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "none",
                      position: "relative",
                      padding: "16px 22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(124,58,237,0.25)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    }}
                  >
                    {idx === 0 && (
                      <div style={{ display: "flex", marginBottom: -6 }}>
                        <div style={{
                          background: GRADIENT,
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}>
                          Charter Special
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      
                      {/* Airline Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100, flexShrink: 0 }}>
                        <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
                          {s.airlineLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.airlineLogo} alt={s.airline} style={{ maxWidth: 80, maxHeight: 40, objectFit: "contain" }} />
                          ) : (
                            <PiAirplaneTilt size={28} color="rgba(255,255,255,0.85)" />
                          )}
                        </div>
                        <span style={{ fontSize: 13, color: "#E2E8F0", textAlign: "center", lineHeight: 1.2 }}>{s.airline}</span>
                        <span style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", marginTop: 2 }}>{s.flightNumber}</span>
                      </div>

                      {/* Departure Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 140 }}>
                        <span style={{ fontSize: 13, color: "#94A3B8", marginBottom: 4 }}>{s.originCity} ({s.originCode})</span>
                        <span style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1 }}>{s.departureTime || "--:--"}</span>
                        <span style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
                          {s.departureDate ? new Date(s.departureDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).replace(',', '') : "--"}
                        </span>
                      </div>

                      {/* Duration Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 120px", minWidth: 120, maxWidth: 180 }}>
                        <span style={{ fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>{s.duration}</span>
                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.3)", background: "transparent", flexShrink: 0 }}></div>
                          <div style={{ flex: 1, height: 1.5, background: "rgba(255,255,255,0.2)" }}></div>
                          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0, marginLeft: -1 }}>
                            <path d="M1 1L5 5L1 9" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        {s.layover && (
                          <div style={{ background: "#5BC0DE", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, marginTop: 6 }}>
                            {s.layover} Stop
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: s.layover ? 4 : 6 }}>
                          <PiBriefcase size={14} color="rgba(255,255,255,0.7)" />
                          <span style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 600 }}>{s.baggage || "40KG"}</span>
                        </div>
                      </div>

                      {/* Arrival Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 140 }}>
                        <span style={{ fontSize: 13, color: "#94A3B8", marginBottom: 4 }}>{s.destinationCity} ({s.destinationCode})</span>
                        <span style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1 }}>{s.arrivalTime || "--:--"}</span>
                        <span style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
                          {s.arrivalDate ? new Date(s.arrivalDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).replace(',', '') : (s.departureDate ? new Date(s.departureDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).replace(',', '') : "--")}
                        </span>
                      </div>

                      {/* Price Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 120 }}>
                        <span style={{ background: "rgba(255,255,255,0.1)", color: "#94A3B8", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, marginBottom: 6 }}>
                          {s.flightRules === "Refundable" ? "Refundable" : "NonRefundable"}
                        </span>
                        <span style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", display: "flex", alignItems: "baseline", gap: 3 }}>
                          <span style={{ fontSize: 13, color: "#94A3B8" }}>SAR </span>{s.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <span style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                          Charter Fare - {s.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <span style={{ fontSize: 11, color: "#FBBF24", marginTop: 6, fontWeight: 700, background: "rgba(245,158,11,0.15)", padding: "2px 6px", borderRadius: 4 }}>
                          {s.remainingSeats} Seats Left
                        </span>
                      </div>

                      {/* Action Section */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
                        <button
                          onClick={() => router.push(`/routes/${s.id}/flights`)}
                          style={{
                            background: GRADIENT,
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 28px",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            width: "100%",
                            transition: "filter 0.2s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.15)"}
                          onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.style.background = GRADIENT; }}
                        >
                          BOOK
                        </button>
                        <button
                          onClick={() => setSelectedFlightModal(s)} 
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#A78BFA",
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
                        <button
                          onClick={() => {
                            setSelectedSectorForItinerary(s);
                            setShowItineraryModal(true);
                          }} 
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#C084FC",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            marginTop: 6,
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                        >
                          <PiDownloadSimple size={12} /> Itinerary
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty state when no live data — only after loading is complete */}
          {!sectorsLoading && openSectors.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.45 }}
              style={{ maxWidth: 780, margin: "24px auto 0", textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.04)", borderRadius: 20, border: "1px dashed rgba(255,255,255,0.12)" }}
            >
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <PiAirplaneTilt size={32} color="rgba(255,255,255,0.85)" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginBottom: 12 }}>No Charter Flights Available</h3>
              <p style={{ color: "#94A3B8", fontSize: 15, maxWidth: 450, margin: "0 auto 24px" }}>
                No charter blocks are currently open. We update our flights regularly — check back soon or contact us for group booking inquiries.
              </p>
              <button
                onClick={() => { if (typeof window !== "undefined") window.location.reload(); }}
                style={{
                  background: GRADIENT, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14
                }}
              >
                Refresh Page
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Flight Details Modal */}
      {selectedFlightModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex",
          alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(8px)"
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "#141827", borderRadius: 16, width: "100%", maxWidth: 640,
              boxShadow: "0 24px 48px rgba(0,0,0,0.2)", overflow: "hidden", position: "relative"
            }}
          >
            {/* Header */}
            <div style={{ background: GRADIENT, padding: "20px 24px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
                {selectedFlightModal.airlineLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedFlightModal.airlineLogo} alt="Airline" style={{ maxHeight: 40, objectFit: "contain" }} />
                ) : (
                  <PiAirplaneTilt size={32} color="rgba(255,255,255,0.85)" />
                )}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>{selectedFlightModal.airline}</div>
                  <div style={{ fontSize: 13, color: "#94A3B8" }}>Flight {selectedFlightModal.flightNumber || selectedFlightModal.flight}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF" }}>{selectedFlightModal.departureTime || "--:--"}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0" }}>{selectedFlightModal.originCity || selectedFlightModal.from?.city} ({selectedFlightModal.originCode || selectedFlightModal.from?.code})</div>
                  <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
                    {selectedFlightModal.departureDate ? new Date(selectedFlightModal.departureDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).replace(',', '') : (selectedFlightModal.date || "Mon Mar 16 2026")}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 16px" }}>
                  <span style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4 }}>{selectedFlightModal.duration}</span>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", background: "transparent" }}></div>
                    <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.3)" }}></div>
                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ marginLeft: -1 }}><path d="M1 1L5 5L1 9" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{selectedFlightModal.layover ? `${selectedFlightModal.layover} Stop(s)` : "Direct"}</span>
                </div>

                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF" }}>{selectedFlightModal.arrivalTime || "--:--"}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0" }}>{selectedFlightModal.destinationCity || selectedFlightModal.to?.city} ({selectedFlightModal.destinationCode || selectedFlightModal.to?.code})</div>
                  <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
                    {selectedFlightModal.arrivalDate ? new Date(selectedFlightModal.arrivalDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).replace(',', '') : (selectedFlightModal.departureDate ? new Date(selectedFlightModal.departureDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).replace(',', '') : (selectedFlightModal.date || "Mon Mar 16 2026"))}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: 12, color: "#94A3B8", display: "block", marginBottom: 2 }}>Baggage Allowance</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 6 }}>
                    <PiBriefcase size={14} color="rgba(255,255,255,0.85)" /> {selectedFlightModal.baggage || "40KG"}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "#94A3B8", display: "block", marginBottom: 2 }}>Flight Rules</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>{selectedFlightModal.flightRules === "Refundable" ? "Refundable" : "NonRefundable"}</span>
                </div>
              </div>
              
              {selectedFlightModal.flightDetails && (
                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginBottom: 8 }}>Additional Information</h4>
                  <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6, background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 6, whiteSpace: "pre-wrap" }}>
                    {selectedFlightModal.flightDetails}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Route Itinerary Direct PiDownloadSimple (Hidden Context) ── */}
      {showItineraryModal && (
          <div className="hidden pointer-events-none appearance-none h-0 w-0 overflow-hidden">
              <BookingReceipt 
                  autoPrint={true}
                  booking={{
                      passengerName: "VALUED CUSTOMER",
                      passportNumber: "PXXXXXXX",
                      baseFare: selectedSectorForItinerary?.price * 0.8 || 0,
                      taxes: selectedSectorForItinerary?.price * 0.15 || 0,
                      serviceFee: selectedSectorForItinerary?.price * 0.05 || 0,
                      sellingPrice: selectedSectorForItinerary?.price || 0,
                      pnr: "PENDING",
                      ticketNumber: "PROPOSED ITINERARY",
                      route: selectedSectorForItinerary,
                  }} 
                  onClose={() => {
                    setShowItineraryModal(false);
                    setSelectedSectorForItinerary(null);
                  }} 
              />
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
      background: "rgba(255,255,255,0.07)", cursor: "default",
      minWidth: 130
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.04em" }}>
        {code}
      </div>
      <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, marginTop: 2 }}>{name}</div>
      <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{sub}</div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: "0 2px" }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        border: "1.5px solid rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(255,255,255,0.05)"
      }}>
        <PiArrowRight size={11} color="rgba(255,255,255,0.7)" />
      </div>
    </div>
  );
}
