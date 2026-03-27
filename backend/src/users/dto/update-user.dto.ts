import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
} from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  agencyName?: string;

  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
