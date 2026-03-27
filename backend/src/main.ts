import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { PrismaClientExceptionFilter } from "./common/filters/prisma-client-exception.filter";
import cookieParser from "cookie-parser";
import { join } from "path";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads/",
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false, // Set to true and configure for specialized production needs
    }),
  );

  app.use(cookieParser());

  // SECURITY AUDIT FIX: Restrict origins in production.
  // currently reflects origin for development convenience but should be whitelisted.
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "https://flyincobooking.com", // Active production domain
      "https://flyinco.vercel.app",
      "https://admin.flyinco.com",
    ],
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Accept, Authorization",
  });

  // Use global validation pipes for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Global Prisma Exception Filter
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`Application is running on: http://0.0.0.0:${port}`);
}
bootstrap().catch((err) => {
  console.error("Critical bootstrap error:", err);
  process.exit(1);
});
