import { IsString, IsEmail, IsOptional, IsNumber } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  routeId: string;

  @IsString()
  passengerName: string;

  @IsString()
  passportNumber: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  paymentReceipt?: string;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  baseFare?: number;

  @IsOptional()
  @IsNumber()
  taxes?: number;

  @IsOptional()
  @IsNumber()
  serviceFee?: number;

  @IsOptional()
  @IsString()
  pnr?: string;

  @IsOptional()
  @IsString()
  ticketNumber?: string;
}
