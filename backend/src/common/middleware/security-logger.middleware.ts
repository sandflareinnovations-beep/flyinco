import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class SecurityLoggerMiddleware implements NestMiddleware {
  private logger = new Logger("SecurityTraffic");

  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl, headers } = req;
    const userAgent = headers["user-agent"] || "";

    // Monitoring for unusual traffic patterns (e.g. suspicious query params or headers)
    if (originalUrl.includes("../") || originalUrl.includes("/etc/passwd")) {
      this.logger.error(
        `Suspicious Access Attempt from IP: ${ip} for URL: ${originalUrl} [User Agent: ${userAgent}]`,
      );
    }

    res.on("finish", () => {
      const { statusCode } = res;
      if (statusCode >= 400) {
        this.logger.warn(
          `${method} ${originalUrl} ${statusCode} - IP: ${ip} - User-Agent: ${userAgent}`,
        );
      }
    });

    next();
  }
}
