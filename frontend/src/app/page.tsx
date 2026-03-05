"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShieldCheck, Plane, Clock, Briefcase,
  ArrowRight, Star, ChevronRight
} from "lucide-react";

// ── Flyinco Brand ──
const B = { primary: "#2E0A57", accent: "#6C2BD9", light: "#EDE9FE" };

const ROUTE = {
  from: { code: "RUH", city: "Riyadh", country: "Saudi Arabia" },
  to: { code: "COK", city: "Cochin", country: "India" },
  date: "09 March 2026",
  price: 2000,
  airline: "Saudia Airlines",
  flight: "SV 890",
  duration: "7h 15m",
  baggage: "2 PC / 30 kg",
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

export default function Home() {
  const router = useRouter();

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
              border: "1px solid rgba(255,255,255,0.8)"
            }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>

                {/* FROM */}
                <SearchField
                  label="FROM"
                  code={ROUTE.from.code}
                  name={ROUTE.from.city}
                  sub={ROUTE.from.country}
                  icon="🛫"
                />

                <Divider />

                {/* TO */}
                <SearchField
                  label="TO"
                  code={ROUTE.to.code}
                  name={ROUTE.to.city}
                  sub={ROUTE.to.country}
                  icon="🛬"
                />

                <Divider />

                {/* DATE */}
                <div style={{
                  flex: "1 1 160px", padding: "16px 20px",
                  background: B.light, borderRadius: 14,
                  cursor: "default"
                }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: B.accent, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                    TRAVEL DATE
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: B.primary, letterSpacing: "-0.02em" }}>
                    09 March
                  </div>
                  <div style={{ fontSize: 11, color: B.accent, marginTop: 2, fontWeight: 500 }}>
                    2026 · One way
                  </div>
                </div>

                {/* Search CTA */}
                <button
                  onClick={() => router.push("/routes/ruh-cok/flights")}
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
                ✈ Fares available for <strong style={{ color: B.primary }}>Riyadh (RUH) → Cochin (COK)</strong> · More routes coming soon
              </p>
            </div>
          </motion.div>

          {/* Trust signals */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px", marginTop: 36 }}>
              {[
                { label: "4.9/5 Rated Agency", icon: <Star size={13} fill="#FBBF24" color="#FBBF24" /> },
                { label: "PNR in 30 Minutes", icon: <Clock size={13} color="#86EFAC" /> },
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
              { Icon: Clock, label: "PNR Issued in 30 Minutes", color: "#F59E0B" },
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
                SPECIAL FARE CARD
            ═══════════════════════════════════════════ */}
      <section style={{ background: "#F7F7FB", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4 }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <Pill>🔥 Limited Time Offer</Pill>
            <h2 style={{
              fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900,
              color: "#0F0A1A", letterSpacing: "-0.04em",
              marginTop: 14, marginBottom: 8
            }}>
              Featured Route
            </h2>
            <p style={{ color: "#6B7280", fontSize: 15 }}>
              One exclusive route. Unbeatable price. Book before seats run out.
            </p>
          </motion.div>

          {/* Fare card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.45 }}
            style={{ maxWidth: 780, margin: "0 auto" }}
          >
            <div style={{
              background: "#fff",
              borderRadius: 24,
              border: "1px solid #E5E7EB",
              boxShadow: "0 4px 32px rgba(46,10,87,0.08), 0 1px 4px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}>
              {/* Top bar */}
              <div style={{ height: 5, background: `linear-gradient(90deg, ${B.primary}, ${B.accent}, #A78BFA)` }} />

              <div style={{ padding: "36px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 32 }}>

                {/* Left: Flight info */}
                <div style={{ flex: 1, minWidth: 280 }}>
                  {/* Airline row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: B.light, display: "flex",
                      alignItems: "center", justifyContent: "center"
                    }}>
                      <Plane size={20} color={B.accent} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{ROUTE.airline}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>
                        {ROUTE.flight} · {ROUTE.duration}
                      </p>
                    </div>
                  </div>

                  {/* Route display */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                    <div>
                      <p style={{ fontSize: 50, fontWeight: 900, color: B.primary, letterSpacing: "-0.05em", lineHeight: 1 }}>
                        {ROUTE.from.code}
                      </p>
                      <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4, fontWeight: 500 }}>{ROUTE.from.city}</p>
                    </div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 80 }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>{ROUTE.duration}</span>
                      <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 6 }}>
                        <div style={{ flex: 1, height: 1.5, background: "#E5E7EB" }} />
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: B.light, display: "flex",
                          alignItems: "center", justifyContent: "center"
                        }}>
                          <Plane size={12} color={B.accent} />
                        </div>
                        <div style={{ flex: 1, height: 1.5, background: "#E5E7EB" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>Direct</span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 50, fontWeight: 900, color: B.primary, letterSpacing: "-0.05em", lineHeight: 1 }}>
                        {ROUTE.to.code}
                      </p>
                      <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4, fontWeight: 500, textAlign: "right" }}>{ROUTE.to.city}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Pill>📅 {ROUTE.date}</Pill>
                    <Pill bg="#F0FDF4" color="#15803D">🧳 {ROUTE.baggage}</Pill>
                    <Pill bg="#FEF2F2" color="#DC2626">⚠️ Limited Seats</Pill>
                  </div>
                </div>

                {/* Right: Pricing */}
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 16, minWidth: 180, flexShrink: 0
                }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>
                      From
                    </p>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: B.primary, paddingTop: 8 }}>SAR</span>
                      <span style={{ fontSize: 56, fontWeight: 900, color: B.primary, letterSpacing: "-0.05em", lineHeight: 1 }}>
                        {ROUTE.price.toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>per person</p>
                  </div>

                  <button
                    onClick={() => router.push("/routes/ruh-cok/flights")}
                    style={{
                      width: "100%",
                      background: `linear-gradient(135deg, ${B.primary} 0%, ${B.accent} 100%)`,
                      color: "white", border: "none", borderRadius: 12,
                      padding: "14px 20px", cursor: "pointer",
                      fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: `0 8px 24px ${B.primary}44`,
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 14px 32px ${B.primary}60`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = `0 8px 24px ${B.primary}44`;
                    }}
                  >
                    Book Now <ArrowRight size={16} />
                  </button>

                  <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
                    🔒 Secure · Instant confirmation
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

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
