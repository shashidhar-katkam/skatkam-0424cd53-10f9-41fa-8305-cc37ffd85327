import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockExecutionContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when route is public', () => {
      const context = mockExecutionContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should call super.canActivate when route is not public', () => {
      const context = mockExecutionContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const superCanActivate = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate'
      );
      superCanActivate.mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(superCanActivate).toHaveBeenCalledWith(context);
      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should throw err when err is provided', () => {
      const err = new Error('Token expired');
      expect(() =>
        guard.handleRequest(err, { id: '1' }, undefined, undefined, undefined)
      ).toThrow(err);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() =>
        guard.handleRequest(null, null, undefined, undefined, undefined)
      ).toThrow(UnauthorizedException);
      expect(() =>
        guard.handleRequest(null, null, undefined, undefined, undefined)
      ).toThrow('Invalid or expired token');
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() =>
        guard.handleRequest(undefined, undefined, undefined, undefined, undefined)
      ).toThrow(UnauthorizedException);
    });

    it('should return user when valid', () => {
      const user = { id: '1', email: 'a@b.com' };
      const result = guard.handleRequest(null, user, undefined, undefined, undefined);
      expect(result).toBe(user);
    });
  });
});
