import { IsString, IsNumber, IsOptional, Min, IsIn } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  agentId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsIn(['PAYMENT', 'DUES'])
  type: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
