import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  origin: string;

  @IsString()
  destination: string;

  @IsNumber()
  price: number;

  @IsNumber()
  totalSeats: number;

  @IsDateString()
  departureDate: string;

  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @IsOptional()
  @IsString()
  airline?: string;

  @IsOptional()
  @IsString()
  flightNumber?: string;

  @IsOptional()
  @IsString()
  departureTime?: string;

  @IsOptional()
  @IsString()
  arrivalTime?: string;

  @IsOptional()
  @IsString()
  baggage?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  originCity?: string;

  @IsOptional()
  @IsString()
  destinationCity?: string;

  @IsOptional()
  @IsString()
  airlineLogo?: string;

  @IsOptional()
  @IsString()
  layover?: string;

  @IsOptional()
  @IsString()
  flightRules?: string;

  @IsOptional()
  @IsString()
  flightDetails?: string;
}
