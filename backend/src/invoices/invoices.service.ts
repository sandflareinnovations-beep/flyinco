import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto, userId?: string) {
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: dto.invoiceNumber,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        items: dto.items as any,
        subtotal: dto.subtotal,
        vatRate: dto.vatRate,
        vatAmount: dto.vatAmount,
        total: dto.total,
        notes: dto.notes,
        createdById: userId,
      },
    });
    return invoice;
  }

  async findAll(page = 1, limit = 50, search?: string) {
    const where = search
      ? {
          OR: [
            { invoiceNumber: { contains: search, mode: 'insensitive' } as any },
            { customerName: { contains: search, mode: 'insensitive' } as any },
          ],
        }
      : {};

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async delete(id: string) {
    await this.prisma.invoice.delete({ where: { id } });
    return { success: true };
  }
}
