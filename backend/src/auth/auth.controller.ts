import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { IApiResponse } from '../common/interfaces/api-response.interface';

/**
 * AuthController — ODDT-230
 * Three public endpoints: register, login, logout.
 * No guards — these routes are the entry point for unauthenticated users.
 * Each method is a single delegation line; all logic lives in AuthService.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ODDT-232, ODDT-233 — Register a new account
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  async register(
    @Body() dto: RegisterDto,
  ): Promise<IApiResponse<object>> {
    const user = await this.authService.register(dto);
    return { success: true, data: user, message: 'Account created successfully' };
  }

  // ODDT-234 — Login: validates credentials, returns auth token
  @Post('login')
  @ApiOperation({ summary: 'Login — returns x-auth-token for subsequent requests' })
  async login(
    @Body() dto: LoginDto,
  ): Promise<IApiResponse<{ token: string; user: object }>> {
    const result = await this.authService.login(dto);
    return { success: true, data: result };
  }

  // ODDT-235 — Logout: invalidates the current token
  @Post('logout')
  @ApiOperation({ summary: 'Invalidate auth token (logout)' })
  logout(
    @Headers('x-auth-token') token: string,
  ): IApiResponse<null> {
    this.authService.logout(token);
    return { success: true, message: 'Logged out successfully' };
  }
}
