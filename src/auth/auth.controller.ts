import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto.email, registerDto.password);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Body('userId') userId: number,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const userId = req.user.sub;
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }
}
