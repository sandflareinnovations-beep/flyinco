import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

const CONFIDENTIAL_KEYS = new Set([
  "purchasePrice",
  "profit",
  "totalCost",
  "totalProfit",
  "totalRevenue",
  "totalUnpaidDues",
  "creditLimit",
  "totalPaid",
  "totalSales",
  "outstanding",
  "pendingDues",
  "topAgent",
  "agentPerformance",
  "supplier",
]);

function stripConfidentialFields(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(stripConfidentialFields);
  if (obj instanceof Date) return obj;
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (CONFIDENTIAL_KEYS.has(key)) continue;
      cleaned[key] = stripConfidentialFields(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

@Injectable()
export class StaffFilterInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== "STAFF") {
      return next.handle();
    }

    return next.handle().pipe(map((data) => stripConfidentialFields(data)));
  }
}
