import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.announcement.create({ data });
  }

  findAll() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  findOne(id: string) {
    return this.prisma.announcement.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.announcement.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
