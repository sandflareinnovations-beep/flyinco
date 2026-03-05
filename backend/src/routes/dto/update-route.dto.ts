import { PartialType } from '@nestjs/mapped-types';
import { CreateRouteDto } from './create-route.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateRouteDto extends PartialType(CreateRouteDto) {
    @IsOptional()
    @IsNumber()
    remainingSeats?: number;
}
