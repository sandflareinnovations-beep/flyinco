import { ArgumentsHost, Catch, HttpStatus, Logger } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Prisma } from "@prisma/client";
import { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, "");

    switch (exception.code) {
      case "P2002": {
        const status = HttpStatus.CONFLICT;
        this.logger.warn(`Unique constraint failed (P2002): ${message}`);
        response.status(status).json({
          statusCode: status,
          message: "A record with this value already exists.",
          error: "Conflict",
        });
        break;
      }
      case "P2025": {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message: "The requested record was not found.",
          error: "Not Found",
        });
        break;
      }
      case "P2003": {
        const status = HttpStatus.BAD_REQUEST;
        this.logger.warn(`Foreign key constraint failed (P2003): ${message}`);
        response.status(status).json({
          statusCode: status,
          message:
            "Cannot delete or update this record because it is referenced by other data.",
          error: "Bad Request",
        });
        break;
      }
      default:
        // default 500 but with more info logged
        this.logger.error(
          `Unhandled Prisma error (${exception.code}): ${message}`,
        );
        super.catch(exception, host);
        break;
    }
  }
}
