import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

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
    @IsIn(['USER', 'ADMIN'])
    role?: string;
}
