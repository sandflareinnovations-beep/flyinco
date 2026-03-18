import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { MailService } from '../mail/mail.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, MailService],
})
export class BookingsModule { }
