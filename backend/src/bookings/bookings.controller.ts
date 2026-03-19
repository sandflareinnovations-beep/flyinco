import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Optional,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  // ── Authenticated endpoint: user or agent can create a booking ──
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    const userId = req?.user?.id || null;
    return this.bookingsService.create(createBookingDto, userId);
  }

  // ── Public endpoint: upload receipt ──
  @Post('upload-receipt')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `receipt-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
          return cb(new Error('Only image and PDF files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadReceipt(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      return { error: 'No file uploaded' };
    }
    const host = req.get('host');
    const proto = req.protocol;
    return {
      url: `${proto}://${host}/uploads/${file.filename}`,
    };
  }

  // ── Admin: Bulk Import Bookings from Excel ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('bulk-import')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
          return cb(new Error('Only Excel and CSV files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async bulkImport(@UploadedFile() file: Express.Multer.File) {
    return this.bookingsService.bulkImport(file);
  }

  // ── Admin/Agent/User: view their bookings ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'AGENT', 'USER')
  @Get()
  findAll(@Req() req: any) {
    return this.bookingsService.findAll(req.user);
  }

  // ── User/Admin: view one booking ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'ADMIN', 'AGENT')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.findOne(id, req.user);
  }

  // ── Admin: update booking status / issue PNR ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  // ── Admin: delete booking ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('bulk')
  removeMany(@Body('ids') ids: string[]) {
    return this.bookingsService.removeMany(ids);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }

  // ── Admin: send ticket PDF to customer ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/send-ticket')
  @UseInterceptors(
    FileInterceptor('ticket', {
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf)$/)) {
          return cb(new Error('Only PDF files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async sendTicket(
    @Param('id') bookingId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bookingsService.sendTicketToCustomer(bookingId, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/send-itinerary')
  async sendItinerary(
    @Param('id') id: string,
    @Body('email') email?: string,
  ) {
    return this.bookingsService.sendItinerary(id, email);
  }
}
