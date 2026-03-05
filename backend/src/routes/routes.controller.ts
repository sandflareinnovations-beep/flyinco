import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('routes')
export class RoutesController {
    constructor(private readonly routesService: RoutesService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    create(@Body() createRouteDto: CreateRouteDto) {
        return this.routesService.create(createRouteDto);
    }

    // Allow anyone (authenticated or not, or maybe just authenticated. Let's say anyone)
    @Get()
    findAll() {
        return this.routesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.routesService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
        return this.routesService.update(id, updateRouteDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/booking-status')
    toggleBookingStatus(@Param('id') id: string, @Body() body: { bookingStatus: string }) {
        return this.routesService.updateBookingStatus(id, body.bookingStatus);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.routesService.remove(id);
    }
}
