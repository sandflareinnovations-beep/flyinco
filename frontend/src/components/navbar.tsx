"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const BRAND = "#2E0A57";
const BRAND_HOVER = "#3B0F70";

export function Navbar() {
    const [hovered, setHovered] = useState(false);
    const pathname = usePathname();
    const isHome = pathname === "/";

    const btnStyle: React.CSSProperties = {
        backgroundColor: hovered ? BRAND_HOVER : BRAND,
        color: "white",
        fontSize: 13,
        fontWeight: 600,
        padding: "9px 22px",
        borderRadius: 8,
        textDecoration: "none",
        transition: "background-color 0.15s ease",
        whiteSpace: "nowrap",
        display: "inline-block",
        letterSpacing: "-0.01em",
    };

    return (
        <nav
            className="sticky top-0 z-50"
            style={{
                background: isHome ? "transparent" : "white",
                borderBottom: isHome ? "none" : "1px solid #E5E7EB",
                boxShadow: isHome ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
            }}
        >
            <div
                className="flex items-center justify-between"
                style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 64 }}
            >
                {/* Logo */}
                <Link href="/" style={{ display: "flex", alignItems: "center" }}>
                    <Image
                        src="/logo.png"
                        alt="Flyinco Travel & Tourism"
                        width={180}
                        height={48}
                        style={{
                            height: isHome ? 48 : 36,
                            width: "auto",
                            // On home, invert to white to show over hero image. On other pages, keep native purple.
                            filter: isHome ? "brightness(0) invert(1)" : "none",
                            transition: "height 0.2s ease"
                        }}
                        className="object-contain"
                        priority
                    />
                </Link>

                {/* Only show Login button on homepage */}
                {isHome && (
                    <Link
                        href="/login"
                        style={btnStyle}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                    >
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
}
