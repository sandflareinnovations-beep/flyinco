import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateTaskDto, @Request() req: any) {
    return this.tasksService.create(dto, req.user.id);
  }

  @Get('my-tasks')
  @Roles('ADMIN', 'STAFF')
  findMyTasks(@Request() req: any) {
    return this.tasksService.findAllForStaff(req.user.id);
  }

  @Get()
  @Roles('ADMIN')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tasksService.findAllForAdmin(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'STAFF')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    return this.tasksService.updateStatus(id, status, req.user.id);
  }

  @Patch(':id/progress')
  @Roles('ADMIN', 'STAFF')
  updateProgress(
    @Param('id') id: string,
    @Body('current') current: number,
  ) {
    return this.tasksService.updateProgress(id, current);
  }

  @Delete(':id')
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.tasksService.delete(id);
  }
}
