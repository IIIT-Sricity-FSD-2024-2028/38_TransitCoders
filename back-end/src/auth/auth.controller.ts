import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import type { IUser } from '../users/interfaces/user.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { IApiResponse } from '../common/interfaces/api-response.interface';

/**
 * AuthController — ODDT-230
 * Three public endpoints: register, login, logout.
 * No AuthGuard — these routes are the entry point for unauthenticated users.
 *
 * Rate limiting: @UseGuards(ThrottlerGuard) on login and register
 * prevents brute-force attacks.
 * Throttler is configured in AppModule: 60 requests / 60 seconds globally.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ODDT-232, ODDT-233 — Register a new account
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  async register(
    @Body() dto: RegisterDto,
  ): Promise<IApiResponse<object>> {
    const user = await this.authService.register(dto);
    return { success: true, data: user, message: 'Account created successfully' };
  }

  // ODDT-234 — Login: validates credentials, returns auth token
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Login — returns x-auth-token for subsequent requests' })
  @ApiResponse({ status: 200, description: 'Login successful, returns token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account pending approval' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  async login(
    @Body() dto: LoginDto,
  ): Promise<IApiResponse<{ token: string; user: object }>> {
    const result = await this.authService.login(dto);
    return { success: true, data: result };
  }

  // Session validation — used by the frontend to restore/verify sessions
  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get the currently authenticated user (session check)' })
  @ApiResponse({ status: 200, description: 'Authenticated user returned' })
  @ApiResponse({ status: 401, description: 'Invalid or missing token' })
  me(@CurrentUser() user: IUser): IApiResponse<object> {
    const { password: _pw, authToken: _t, ...safeUser } = user;
    return { success: true, data: safeUser };
  }

  // ODDT-235 — Logout: invalidates the current token
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate auth token (logout)' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  logout(
    @Headers('x-auth-token') token: string,
  ): IApiResponse<null> {
    this.authService.logout(token);
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * POST /auth/forgot-password
   * Accepts an email, validates it exists, and acknowledges the request.
   * A real implementation would queue an email with a reset link.
   * For security, always returns the same response regardless of whether
   * the email is registered (prevents user enumeration).
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Request a password reset link (acknowledged, no email sent in demo)' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Reset request acknowledged' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  forgotPassword(@Body() dto: ForgotPasswordDto): IApiResponse<null> {
    // Intentionally fire-and-forget: authService validates the email and logs
    // the event, but the response is always the same (no user enumeration).
    this.authService.forgotPassword(dto.email);
    return {
      success: true,
      message: 'If that email address is in our system, a reset link has been sent.',
    };
  }
}
