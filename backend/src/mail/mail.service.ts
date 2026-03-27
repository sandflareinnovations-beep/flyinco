import { Injectable } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class MailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
  }

  async sendBookingConfirmation(
    email: string,
    bookingId: string,
  ): Promise<void> {
    console.log("Sending booking confirmation to:", email);
    console.log("Booking ID:", bookingId);

    try {
      const response = await this.resend.emails.send({
        from: "Flyinco <booking@flyincobooking.com>",
        to: email,
        subject: "Flyinco Booking Confirmation",
        html: `     <h2>Your seat has been held successfully</h2>     <p><b>Booking ID:</b> ${bookingId}</p>     <p>Your ticket will be issued shortly.</p>     <b>Flyinco Travel Management Company</b>
  `,
      });

      console.log("Resend response:", response);
    } catch (error) {
      console.error("Resend error:", error);
    }
  }

  async sendTicketEmail(email: string, pdf: Buffer) {
    try {
      await this.resend.emails.send({
        from: "Flyinco <booking@flyincobooking.com>",
        to: email,
        subject: "Your Flyinco Flight Ticket",
        html: `       <h2>Your Ticket is Confirmed</h2>       <p>Your airline ticket is attached to this email.</p>       <p>Have a pleasant journey.</p>       <b>Flyinco Travel Management Company</b>
    `,
        attachments: [
          {
            filename: "ticket.pdf",
            content: pdf,
          },
        ],
      });
    } catch (error) {
      console.error("Resend ticket email error:", error);
      throw new Error(
        "Failed to send ticket email. Please check the email address.",
      );
    }
  }

  async sendItineraryEmail(
    email: string,
    passengerName: string,
    itineraryHtml: string,
  ) {
    try {
      await this.resend.emails.send({
        from: "Flyinco <booking@flyincobooking.com>",
        to: email,
        subject: `Flight Itinerary - ${passengerName}`,
        html: itineraryHtml,
      });
    } catch (error) {
      console.error("Resend itinerary email error:", error);
      throw new Error(
        "Failed to send itinerary email. Please check the email address.",
      );
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;
    try {
      await this.resend.emails.send({
        from: "Flyinco Auth <auth@flyincobooking.com>",
        to: email,
        subject: "Verify your Flyinco Account",
        html: `
                    <h2>Welcome to Flyinco!</h2>
                    <p>Please verify your email address by clicking the link below:</p>
                    <a href="${url}">${url}</a>
                    <p>This link will expire in 24 hours.</p>
                `,
      });
    } catch (error) {
      console.error("Verification email error:", error);
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    try {
      await this.resend.emails.send({
        from: "Flyinco Auth <auth@flyincobooking.com>",
        to: email,
        subject: "Reset your Flyinco Password",
        html: `
                    <h2>Forgot your password?</h2>
                    <p>Click the link below to reset your password:</p>
                    <a href="${url}">${url}</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                `,
      });
    } catch (error) {
      console.error("Password reset email error:", error);
    }
  }
}
