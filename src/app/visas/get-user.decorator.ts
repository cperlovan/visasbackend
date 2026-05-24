import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si se pasa un argumento al decorador (ej: 'id'), retorna esa propiedad específica
    return data ? user?.[data] : user;
  },
);