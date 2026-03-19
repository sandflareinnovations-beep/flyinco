import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { calculateAgentFinances } from '../common/finance.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        agencyName: true,
        creditLimit: true,
        totalPaid: true,
        outstanding: true,
        pendingDues: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(users.map(u => {
      if (u.role === 'AGENT') {
        return calculateAgentFinances(this.prisma, u);
      }
      return u;
    }));
  }

  async findAllPaginated(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { agencyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          agencyName: true,
          creditLimit: true,
          totalPaid: true,
          outstanding: true,
          pendingDues: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const usersWithFinances = await Promise.all(users.map(u => {
      if (u.role === 'AGENT') {
        return calculateAgentFinances(this.prisma, u);
      }
      return u;
    }));

    return {
      users: usersWithFinances,
      total,
      page,
      limit,
    };
  }

  async createUser(dto: CreateUserDto & { agencyName?: string; creditLimit?: number }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already in use');
    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashed,
        role: dto.role || 'USER',
        agencyName: dto.agencyName,
        creditLimit: dto.creditLimit ? Number(dto.creditLimit) : 0,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, agencyName: true, createdAt: true },
    });
  }

  async updateUser(id: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    // Only allowed fields
    const allowedFields: any = {};
    const updates = ['name', 'phone', 'agencyName', 'creditLimit', 'role'];
    updates.forEach(field => {
      if (data[field] !== undefined) allowedFields[field] = data[field];
    });

    if (data.email && data.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new BadRequestException('Email already in use');
      allowedFields.email = data.email;
    }

    if (data.password && data.password.trim().length >= 6) {
      allowedFields.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...allowedFields,
        creditLimit: allowedFields.creditLimit !== undefined ? Number(allowedFields.creditLimit) : undefined
      },
      select: { id: true, name: true, email: true, phone: true, role: true, agencyName: true, createdAt: true },
    });
  }

  async changePassword(dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: dto.userId }, data: { password: hashed } });
    return { message: 'Password updated successfully' };
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.delete({ where: { id } });
  }
}

