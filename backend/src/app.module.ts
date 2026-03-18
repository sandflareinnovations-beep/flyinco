import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RoutesModule } from './routes/routes.module';
import { BookingsModule } from './bookings/bookings.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailService } from './mail/mail.service';
import { AnnouncementsModule } from './announcements/announcements.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    PrismaModule,
    RoutesModule,
    BookingsModule,
    UsersModule,
    AuthModule,
    AnnouncementsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule { }
