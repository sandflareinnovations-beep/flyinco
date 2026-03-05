import { IsString, IsNumber, IsDateString } from 'class-validator';

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

  // Optional detailed fields
  airline?: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  baggage?: string;
  duration?: string;
  originCity?: string;
  destinationCity?: string;
  airlineLogo?: string;
  layover?: string;
  flightRules?: string;
  flightDetails?: string;
}
