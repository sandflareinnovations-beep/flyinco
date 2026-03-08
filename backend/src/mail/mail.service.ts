import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    async sendBookingConfirmation(email: string, bookingId: string): Promise<void> {
        // Mock implementation to satisfy TypeScript compiler
        console.log(`Sending booking confirmation to ${email} for booking ${bookingId}`);
    }
}