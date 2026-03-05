import { IsString, IsEmail, IsOptional } from 'class-validator';

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
}
