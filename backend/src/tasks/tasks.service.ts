import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaskDto, userId: string) {
    // Validate that the assigned user exists
    const assignedUser = await this.prisma.user.findUnique({
      where: { id: dto.assignedToId },
    });
    if (!assignedUser) {
      throw new NotFoundException(`User with ID ${dto.assignedToId} not found`);
    }

    // Convert dueDate string to ISO-8601 DateTime if provided
    let dueDate = null;
    if (dto.dueDate) {
      // Handle both "YYYY-MM-DD" and ISO-8601 formats
      const dateStr = typeof dto.dueDate === 'string' ? dto.dueDate : dto.dueDate.toString();
      // If it's just a date string (YYYY-MM-DD), append time at midnight UTC
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dueDate = new Date(`${dateStr}T00:00:00Z`);
      } else {
        dueDate = new Date(dateStr);
      }
      // Validate the date is valid
      if (isNaN(dueDate.getTime())) {
        throw new Error(`Invalid date format for dueDate: ${dateStr}`);
      }
    }

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
        dueDate: dueDate,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
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
