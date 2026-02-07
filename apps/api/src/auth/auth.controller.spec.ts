import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AppLoggerService } from '../shared/logger/logger.service';

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    me: jest.fn(),
  };
  const mockLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login should call authService.login', async () => {
    mockAuthService.login.mockResolvedValue({ accessToken: 'token' });
    await controller.login({ email: 'a@b.com', password: 'pass' } as any);
    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pass',
    });
  });

  it('register should call authService.register', async () => {
    mockAuthService.register.mockResolvedValue({ accessToken: 'token' });
    await controller.register({
      email: 'a@b.com',
      password: 'pass',
      organizationName: 'Org',
    } as any);
    expect(mockAuthService.register).toHaveBeenCalled();
  });

  it('me should call authService.me', async () => {
    mockAuthService.me.mockResolvedValue({ user: {} });
    await controller.me('user-id');
    expect(mockAuthService.me).toHaveBeenCalledWith('user-id');
  });
});
