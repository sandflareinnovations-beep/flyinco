"use client";
import { PiAirplaneTilt, PiArrowRight } from "react-icons/pi";
import Link from "next/link";

export default function StaffBookPage() {
    return (
        <div className="max-w-2xl mx-auto py-16 text-center space-y-8">
            <div
                className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2E0A57, #6C2BD9)" }}
            >
                <PiAirplaneTilt className="h-10 w-10 text-white" />
            </div>

            <div>
                <h1 className="text-2xl font-black text-gray-900">Book a Ticket</h1>
                <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                    Browse available flights and create a new booking for a passenger.
                </p>
            </div>

            <Link
                href="/routes"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #2E0A57, #6C2BD9)" }}
            >
                Browse Available Flights
                <PiArrowRight className="h-4 w-4" />
            </Link>

            <p className="text-xs text-gray-300">
                You will be taken to the flight search page to select a route and complete the booking.
            </p>
        </div>
    );
}
