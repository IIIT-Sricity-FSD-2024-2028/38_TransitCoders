import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import type { IApiResponse } from '../common/interfaces/api-response.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login — returns auth token' })
  async login(@Body() dto: LoginDto): Promise<IApiResponse<{ token: string; user: object }>> {
    const result = await this.authService.login(dto);
    return { success: true, data: result };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  async register(@Body() dto: CreateUserDto): Promise<IApiResponse<object>> {
    const user = await this.authService.register(dto);
    return { success: true, data: user, message: 'Account created successfully' };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Invalidate auth token' })
  logout(@Headers('x-auth-token') token: string): IApiResponse<null> {
    this.authService.logout(token);
    return { success: true, message: 'Logged out successfully' };
  }
}
