import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  total: number;
}

export class CreateInvoiceDto {
  @IsString()
  invoiceNumber: string;

  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsNumber()
  subtotal: number;

  @IsNumber()
  vatRate: number;

  @IsNumber()
  vatAmount: number;

  @IsNumber()
  total: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
