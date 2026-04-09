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
    booking: any,
  ): Promise<void> {
    console.log("Sending booking confirmation to:", email);
    console.log("Booking ID:", booking.id);

    const passengerName = booking.passengerName || "Valued Customer";
    const bookingRef = `FLY-${(booking.id || "").substring(0, 8).toUpperCase()}`;
    const origin = booking.route?.origin || "—";
    const destination = booking.route?.destination || "—";
    const airline = booking.route?.airline || "—";
    const flightNumber = booking.route?.flightNumber || "—";
    const travelDate = booking.travelDate
      ? new Date(booking.travelDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      : booking.route?.departureDate
      ? new Date(booking.route.departureDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      : "To be confirmed";
    const departureTime = booking.route?.departureTime || "";
    const status = booking.status || "HELD";

    try {
      const response = await this.resend.emails.send({
        from: "Flyinco <booking@flyincobooking.com>",
        to: email,
        subject: `Booking Confirmation - ${bookingRef} | ${origin} → ${destination}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">FLYINCO</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;font-weight:500;">Travel Management Company</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="background-color:${status === "CONFIRMED" ? "#ecfdf5" : "#faf5ff"};padding:16px 40px;text-align:center;border-bottom:1px solid ${status === "CONFIRMED" ? "#d1fae5" : "#ede9fe"};">
              <p style="margin:0;font-size:14px;font-weight:700;color:${status === "CONFIRMED" ? "#059669" : "#7c3aed"};">
                ${status === "CONFIRMED" ? "✓ BOOKING CONFIRMED" : "⏳ SEAT HELD SUCCESSFULLY"}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <p style="margin:0;font-size:16px;color:#374151;">Dear <strong>${passengerName}</strong>,</p>
              <p style="margin:12px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
                ${status === "CONFIRMED"
                  ? "Your booking has been confirmed. Below are your travel details."
                  : "Your seat has been held successfully. Your ticket will be issued shortly. Below are your booking details."}
              </p>
            </td>
          </tr>

          <!-- Booking Reference -->
          <tr>
            <td style="padding:8px 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
                    <p style="margin:8px 0 0;font-size:24px;font-weight:800;color:#1f2937;letter-spacing:1px;">${bookingRef}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Flight Details -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5ff;border-radius:12px;border:1px solid #ede9fe;">
                <tr>
                  <td style="padding:24px;">
                    <!-- Route -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="text-align:center;">
                          <p style="margin:0;font-size:28px;font-weight:800;color:#4f46e5;">${origin}</p>
                        </td>
                        <td style="text-align:center;width:80px;">
                          <p style="margin:0;font-size:20px;color:#a78bfa;">✈</p>
                        </td>
                        <td style="text-align:center;">
                          <p style="margin:0;font-size:28px;font-weight:800;color:#4f46e5;">${destination}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Details Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #ede9fe;">
                          <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;">Travel Date</p>
                          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1f2937;">${travelDate}${departureTime ? ` at ${departureTime}` : ""}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #ede9fe;">
                          <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;">Airline</p>
                          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1f2937;">${airline}</p>
                        </td>
                      </tr>
                      ${flightNumber !== "—" ? `
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #ede9fe;">
                          <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;">Flight Number</p>
                          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1f2937;">${flightNumber}</p>
                        </td>
                      </tr>` : ""}
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #ede9fe;">
                          <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;">Passenger</p>
                          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1f2937;">${passengerName}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#374151;">Need Assistance?</p>
                    <p style="margin:8px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
                      For any queries regarding your booking, please contact us at:<br>
                      <strong>Email:</strong> support@flyincobooking.com<br>
                      <strong>Phone:</strong> +966 XX XXX XXXX
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1f2937;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;">Flyinco Travel Management Company</p>
              <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">This is an automated email. Please do not reply directly to this message.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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

  async sendAnnouncementEmail(
    email: string,
    announcement: { title: string; content: string; type: string },
  ): Promise<void> {
    const typeColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
      INFO: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", label: "Information" },
      WARNING: { bg: "#fffbeb", text: "#b45309", border: "#fde68a", label: "Warning" },
      ALERT: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca", label: "Alert" },
      SUCCESS: { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0", label: "Good News" },
    };
    const colors = typeColors[announcement.type] || typeColors.INFO;

    try {
      await this.resend.emails.send({
        from: "Flyinco <booking@flyincobooking.com>",
        to: email,
        subject: `${colors.label}: ${announcement.title} — Flyinco`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">FLYINCO</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Travel Management Company</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <div style="background-color:${colors.bg};border:1px solid ${colors.border};border-radius:12px;padding:20px;margin-bottom:20px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${colors.text};text-transform:uppercase;letter-spacing:1px;">${colors.label}</p>
            <h2 style="margin:0;font-size:20px;font-weight:800;color:#1f2937;">${announcement.title}</h2>
          </div>
          <div style="font-size:14px;color:#374151;line-height:1.7;">
            ${announcement.content.replace(/\n/g, "<br>")}
          </div>
        </td></tr>
        <tr><td style="background-color:#1f2937;padding:24px 40px;text-align:center;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;">Flyinco Travel Management Company</p>
          <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">This is an automated notification. Please do not reply directly.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
        `,
      });
    } catch (error) {
      console.error("Announcement email error:", error);
    }
  }
}
