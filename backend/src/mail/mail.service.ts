import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
    private resend: Resend;

    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY || '');
    }

    async sendBookingConfirmation(email: string, bookingId: string): Promise<void> {
        console.log("Sending booking confirmation to:", email);
        console.log("Booking ID:", bookingId);

        try {
            const response = await this.resend.emails.send({
                from: "Flyinco <booking@flyinco.com>",
                to: email,
                subject: "Flyinco Booking Confirmation",
                html: `     <h2>Your seat has been held successfully</h2>     <p><b>Booking ID:</b> ${bookingId}</p>     <p>Your ticket with PNR will be issued shortly.</p>     <b>Flyinco Travel & Tourism</b>
  `
            });

            console.log("Resend response:", response);
        } catch (error) {
            console.error("Resend error:", error);
        }
    }
}