import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../shared';
import { CurrentUser } from '../shared';
import { AppLoggerService } from '../shared/logger/logger.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('AuthController');
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns access token and user with permissions' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    this.logger.debug('POST /auth/login', { email: dto.email });
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register organization and first user (owner); returns token for auto-login' })
  @ApiResponse({ status: 201, description: 'Organization and user created; returns access token and user' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto) {
    this.logger.debug('POST /auth/register', { email: dto.email, organizationName: dto.organizationName });
    return this.authService.register(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current session (user + permissions)' })
  @ApiResponse({ status: 200, description: 'Returns current user and permissions for RBAC' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser('userId') userId: string) {
    this.logger.debug('GET /auth/me', { userId });
    return this.authService.me(userId);
  }
}
