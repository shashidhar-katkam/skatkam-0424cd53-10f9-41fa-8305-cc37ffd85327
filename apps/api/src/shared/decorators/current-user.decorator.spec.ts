import { ExecutionContext } from '@nestjs/common';
import {
  currentUserFactory,
  CurrentUser,
} from './current-user.decorator';

describe('current-user.decorator', () => {
  const createMockContext = (user: object | undefined): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  describe('currentUserFactory', () => {
    it('should return full user when data is undefined', () => {
      const user = { userId: 'u1', email: 'a@b.com' };
      const ctx = createMockContext(user);

      const result = currentUserFactory(undefined, ctx);

      expect(result).toBe(user);
    });

    it('should return user property when data is provided', () => {
      const user = { userId: 'u1', email: 'a@b.com' };
      const ctx = createMockContext(user);

      expect(currentUserFactory('userId', ctx)).toBe('u1');
      expect(currentUserFactory('email', ctx)).toBe('a@b.com');
    });

    it('should return undefined when user is undefined and data is provided', () => {
      const ctx = createMockContext(undefined);

      const result = currentUserFactory('userId', ctx);

      expect(result).toBeUndefined();
    });

    it('should return undefined when user is undefined and data is undefined', () => {
      const ctx = createMockContext(undefined);

      const result = currentUserFactory(undefined, ctx);

      expect(result).toBeUndefined();
    });
  });

  describe('CurrentUser', () => {
    it('should be a param decorator', () => {
      expect(CurrentUser).toBeDefined();
      expect(typeof CurrentUser).toBe('function');
    });
  });
});
