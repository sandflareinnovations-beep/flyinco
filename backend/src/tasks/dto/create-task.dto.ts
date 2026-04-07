import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  target?: number;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  priority?: string;

  @IsOptional()
  @IsEnum(['BOOKING', 'SALES', 'INVOICE'])
  type?: string;

  @IsString()
  assignedToId: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
