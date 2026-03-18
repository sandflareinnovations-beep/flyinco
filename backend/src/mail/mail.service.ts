import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
    private resend: Resend;

    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
    }

    async sendBookingConfirmation(email: string, bookingId: string): Promise<void> {
        console.log("Sending booking confirmation to:", email);
        console.log("Booking ID:", bookingId);

        try {
            const response = await this.resend.emails.send({
                from: "Flyinco <booking@flyincobooking.com>",
                to: email,
                subject: "Flyinco Booking Confirmation",
                html: `     <h2>Your seat has been held successfully</h2>     <p><b>Booking ID:</b> ${bookingId}</p>     <p>Your ticket will be issued shortly.</p>     <b>Flyinco Travel Management Company</b>
  `
            });

            console.log("Resend response:", response);
        } catch (error) {
            console.error("Resend error:", error);
        }
    }

    async sendTicketEmail(email: string, pdf: Buffer) {
        await this.resend.emails.send({
            from: "Flyinco <booking@flyincobooking.com>",
            to: email,
            subject: "Your Flyinco Flight Ticket",
            html: `       <h2>Your Ticket is Confirmed</h2>       <p>Your airline ticket is attached to this email.</p>       <p>Have a pleasant journey.</p>       <b>Flyinco Travel Management Company</b>
    `,
            attachments: [
                {
                    filename: "ticket.pdf",
                    content: pdf
                }
            ]
        });
    }

    async sendItineraryEmail(email: string, passengerName: string, itineraryHtml: string) {
        await this.resend.emails.send({
            from: "Flyinco <booking@flyincobooking.com>",
            to: email,
            subject: `Flight Itinerary - ${passengerName}`,
            html: itineraryHtml
        });
    }
}