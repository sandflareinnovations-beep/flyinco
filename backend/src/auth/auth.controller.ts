import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { calculateAgentFinances } from '../common/finance.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) { }

  @Throttle({ short: { limit: 1, ttl: 5000 }, long: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const data = await this.authService.register(registerDto);
    this.setCookie(res, data.access_token);
    return { 
      user: data.user, 
      token: data.access_token,
      refresh_token: data.refresh_token 
    };
  }

  @Throttle({ short: { limit: 1, ttl: 5000 }, long: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const data = await this.authService.login(loginDto);
    this.setCookie(res, data.access_token);
    return { 
      user: data.user, 
      token: data.access_token,
      refresh_token: data.refresh_token 
    };
  }

  @Post('refresh')
  async refresh(
    @Body('refresh_token') refreshToken: string,
    @Res({ passthrough: true }) res: any
  ) {
    const data = await this.authService.refreshToken(refreshToken);
    this.setCookie(res, data.access_token);
    return { 
      token: data.access_token,
      refresh_token: data.refresh_token 
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        agencyName: true, creditLimit: true, totalPaid: true, outstanding: true, pendingDues: true,
      }
    });
    
    if (user && user.role === 'AGENT') {
      return await calculateAgentFinances(this.prisma, user);
    }
    
    return user || req.user;
  }

  @Throttle({ short: { limit: 1, ttl: 5000 }, long: { limit: 5, ttl: 60000 } })
  @Post('request-password-reset')
  async requestReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  async reset(@Body('token') token: string, @Body('password') password: string) {
    return this.authService.resetPassword(token, password);
  }

  @Post('verify-email')
  async verify(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  private setCookie(res: any, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      // For cross-domain environments like Render/Vercel, 'None' is required for cookies to be sent
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
  }
}
