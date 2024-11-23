import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshTokenGuard } from './refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.role,
    );
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const tokens = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    return {
      ...tokens,
    };
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Body('userId') userId: number,
  ) {
    const tokens = await this.authService.refreshTokens(userId, refreshToken);
    return {
      ...tokens,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const userId = req.user.userId;
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }
}
