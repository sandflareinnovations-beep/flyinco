import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaskDto, userId: string) {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        target: dto.target,
        current: 0,
        status: 'PENDING',
        priority: dto.priority || 'MEDIUM',
        type: dto.type || 'BOOKING',
        assignedToId: dto.assignedToId,
        createdById: userId,
        dueDate: dto.dueDate,
      },
    });
    return task;
  }

  async findAllForStaff(staffId: string) {
    return this.prisma.task.findMany({
      where: { assignedToId: staffId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForAdmin(page = 1, limit = 50) {
    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count(),
    ]);
    return { tasks, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(taskId: string, status: string, userId: string) {
    const data: any = { status };
    if (status === 'COMPLETED') {
      data.completedAt = new Date();
    }
    return this.prisma.task.update({
      where: { id: taskId },
      data,
    });
  }

  async updateProgress(taskId: string, current: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const newStatus = current >= (task.target || 0) ? 'COMPLETED' : task.status;
    const data: any = { current };
    if (newStatus === 'COMPLETED') {
      data.status = 'COMPLETED';
      data.completedAt = new Date();
    }

    return this.prisma.task.update({ where: { id: taskId }, data });
  }

  async delete(taskId: string) {
    await this.prisma.task.delete({ where: { id: taskId } });
    return { success: true };
  }
}
