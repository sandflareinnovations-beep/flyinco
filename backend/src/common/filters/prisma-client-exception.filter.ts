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
        // Extract the relation name from error message if available
        const relationMatch = message.match(/Foreign key constraint failed on the field: `(\w+)`/);
        const fieldName = relationMatch ? relationMatch[1] : "related";
        response.status(status).json({
          statusCode: status,
          message: `The specified ${fieldName} does not exist or has been deleted.`,
          error: "Bad Request",
        });
        break;
      }
      case "P2014": {
        const status = HttpStatus.BAD_REQUEST;
        this.logger.warn(`Required relation violation (P2014): ${message}`);
        response.status(status).json({
          statusCode: status,
          message: "A required field is missing or references a non-existent record.",
          error: "Bad Request",
        });
        break;
      }
      case "P2016": {
        const status = HttpStatus.BAD_REQUEST;
        this.logger.warn(`Required relation not found (P2016): ${message}`);
        response.status(status).json({
          statusCode: status,
          message: "The specified related record was not found.",
          error: "Bad Request",
        });
        break;
      }
      case "P2018": {
        const status = HttpStatus.BAD_REQUEST;
        this.logger.warn(`Required unique argument missing (P2018): ${message}`);
        response.status(status).json({
          statusCode: status,
          message: "A required field is missing for this operation.",
          error: "Bad Request",
        });
        break;
      }
      default:
        // Log unhandled errors but return a clear message instead of 500
        this.logger.error(
          `Unhandled Prisma error (${exception.code}): ${message}`,
        );
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message: "A database error occurred. Please check your input and try again.",
          error: "Bad Request",
          code: exception.code,
        });
        break;
    }
  }
}
