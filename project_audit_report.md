# Flyinco Web Application - Full Project Audit & Report

This report provides a comprehensive overview of the current state of the Flyinco web application, including its core functions, database architecture, recent error fixes, and security audit details. This document is intended for senior developers and stakeholders to understand the project's health and technical roadmap.

---

## 🚀 1. Project Overview

Flyinco is a modern flight booking and agency management ERP. It facilitates B2B and B2C flight bookings with a focus on GCC-themed routes (e.g., Riyadh to Cochin).

### Tech Stack
- **Frontend**: Next.js (App Router), TailwindCSS, React Query, Framer Motion, Lucide/Pi Icons.
- **Backend**: NestJS (Node.js framework), Prisma (ORM), PostgreSQL.
- **Security**: JWT Authentication, RBAC (Admin/Agent/User roles), Helmet, Rate Limiting (Throttler).
- **Hosting/Infrastructure**: Vercel (Frontend), Render/DigitalOcean (Backend/DB).

---

## 🛠️ 2. Core Functions & Modules

### A. Frontend (Next.js)
1.  **Public Home Page**: Dynamic route discovery, featured sectors, and flight search.
2.  **Agent Dashboard**: 
    - Real-time booking management.
    - Credit limit tracking (unpaid dues, total sales).
    - Itinerary download/print (Booking Receipts).
3.  **Admin Panel**:
    - **Sector Management**: Create/Edit/Delete flight routes, seat occupancy tracking.
    - **Booking Management**: Bulk actions (delete), search by agent/phone/PNR, Excel exports.
    - **User/Agent Management**: Role management, credit limit allocation, password reset.
    - **Announcements**: Global site alerts for agents and users.

### B. Backend (NestJS)
1.  **Auth Module**: JWT-based login, cookie handling, role-based guard system.
2.  **Bookings Module**: Financial logic (profit calculation, taxes, base fare), seat subtraction on booking.
3.  **Routes Module**: CRUD for flight sectors, availability checks, booking status (OPEN/CLOSED/SOLD).
4.  **Payments Module**: Tracking agent payments, dues, and supplier settlements.
5.  **Common Middleware**: Security logger, Prisma exception filter, global validation pipe.

---

## 🗄️ 3. Database Report (Prisma/PostgreSQL)

The database is built on PostgreSQL with the following core entities:

### Key Models & Relationships
- **`User`**: Stores identity, credentials, role, and financial metrics (`creditLimit`, `outstanding`).
- **`Route`**: Flight sectors metadata (origin, destination, price, seats, status).
- **`Booking`**: Linked to `Route` and `User`. Stores passenger details, financial breakdown (`purchasePrice`, `profit`), and status (`HELD`, `CONFIRMED`).
- **`Payment` / `SupplierPayment`**: Records transactions for account settling.
- **`Announcement`**: Site-wide alerts.

### Schema Highlights (Prisma)
- **Cascade Deletes**: Deleting a route cleans up its bookings (where applicable).
- **Indexing**: Optimized for search by `passengerName`, `pnr`, `agentDetails`, and `paymentStatus`.

---

## 🐞 4. Error Audit & Recent Fixes

### Fixed: TypeScript "Implicit Any" Errors
Several implicit `any` type errors were identified and fixed in `frontend/src/app/page.tsx`:
- **Problem**: `filter` and `map` parameters in the Home component lacked explicit types, causing build failures in strict mode.
- **Fix**: Added explicit `: any` and `: number` types to lambda parameters to align with current TypeScript configurations.

### Recent Fixes (From Logs)
- **Booking Reflection**: Resolved issues where agent bookings weren't appearing in the admin panel.
- **Seat Occupancy**: Fixed logic where `heldSeats` and `soldSeats` were stuck or miscalculated.
- **Icon Leaks**: Cleaned up leftover text strings like `PiPulse` and `PiUsers` in the UI.
- **Excel Export**: Corrected data mapping in the admin user export tool (PNR, Travel Date, Sector).

### Current Known Issues / TODOs
- **Implicit Any**: Other files may still contain implicit `any` types that need strict typing (e.g., `farePrice` vs `purchasePrice`).
- **DB Constraints**: Need to ensure `userId` in `Booking` is strictly enforced once legacy mock data is purged.

---

## 🔒 5. Security Audit Details

### Active Protections
- **CORS**: Restricted to `flyincobooking.com`, `localhost:3000`, and `admin.flyinco.com`.
- **Helmet**: Integrated for secure HTTP headers.
- **Rate Limiting**: Throttler implemented (Global: 100 req/60s).
- **Input Validation**: Global `ValidationPipe` with `whitelist: true` for DTO protection.
- **Security Logic**: Credit limit checks prevent agents from booking beyond their authorized balance.

### High Priority Security Recommendations
1.  **Strict Typing**: Move from `: any` to shared interfaces/DTOs across frontend and backend.
2.  **Sensitive Data**: Ensure `resetToken` and `refreshToken` are cleared promptly in the database.
3.  **Logging**: The `SecurityLoggerMiddleware` is active; audit its output regularly for suspicious IP patterns.

---

## 📝 6. Notes for Senior Developer

- **Prisma Client**: Always run `npx prisma generate` after schema changes.
- **Environment**: Ensure `NEXT_PUBLIC_API_URL` is set correctly in frontend for it to reach the NestJS backend.
- **Financial Integrity**: Profit is calculated server-side in `bookings.service.ts` based on `route.price` and `purchasePrice`. Do not trust client-side price submissions for critical logic.

*Report Generated: 2026-03-24*
