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

  @IsOptional()
  @IsString()
  prefix?: string;

  @IsOptional()
  @IsString()
  givenName?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsString()
  airline?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  travelDate?: Date;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  agencyEmail?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  request?: string;
}
