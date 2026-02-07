import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const currentUserFactory = (data: string | undefined, ctx: ExecutionContext): unknown => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return data ? user?.[data] : user;
};

export const CurrentUser = createParamDecorator(currentUserFactory);
