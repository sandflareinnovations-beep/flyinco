import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsIn } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  @IsIn(['INFO', 'WARNING', 'ALERT', 'SUCCESS'])
  type?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
