import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      console.error(
        '❌ ERROR: DATABASE_URL is missing in environment variables!',
      );
    }
    await this.$connect();
  }
}
