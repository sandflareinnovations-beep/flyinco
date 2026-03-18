import { IsEmail, IsString, MinLength, IsOptional, IsIn, IsNumber } from 'class-validator';

export class CreateUserDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsIn(['USER', 'ADMIN', 'AGENT'])
    role?: string;

    @IsOptional()
    @IsString()
    agencyName?: string;

    @IsOptional()
    @IsNumber()
    creditLimit?: number;
}
