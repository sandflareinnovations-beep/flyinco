import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsIn,
  IsArray,
} from "class-validator";

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  @IsIn(["INFO", "WARNING", "ALERT", "SUCCESS"])
  type?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsArray()
  @IsOptional()
  targetRoles?: string[];

  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;
}
