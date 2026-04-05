import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { RoutesModule } from "./routes/routes.module";
import { BookingsModule } from "./bookings/bookings.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { MailModule } from "./mail/mail.module";
import { MailService } from "./mail/mail.service";
import { AnnouncementsModule } from "./announcements/announcements.module";
import { PaymentsModule } from "./payments/payments.module";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { BackupService } from "./common/backup.service";
import { SecurityLoggerMiddleware } from "./common/middleware/security-logger.middleware";
import { StaffFilterInterceptor } from "./common/staff-filter.interceptor";

@Module({
  imports: [
    PrismaModule,
    RoutesModule,
    BookingsModule,
    UsersModule,
    AuthModule,
    MailModule,
    AnnouncementsModule,
    PaymentsModule,
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 3,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BackupService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: StaffFilterInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityLoggerMiddleware).forRoutes("*");
  }
}
