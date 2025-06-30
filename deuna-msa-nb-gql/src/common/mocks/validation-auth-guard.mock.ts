import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { v4 as uuidv4 } from 'uuid';

export enum ProfileType {
  Authenticated = 'LOGIN',
  Not_Authenticated = 'NON_LOGIN',
}

@Injectable()
export class MockValidationAuthGuard {
  private mockBehavior: 'success' | 'error' = 'success';

  constructor(private reflector: any) {}

  setMockBehavior(behavior: 'success' | 'error') {
    this.mockBehavior = behavior;
  }

  async canActivate(context: ExecutionContext) {
    let request;

    if (context.getType() === 'http') {
      request = context.switchToHttp().getRequest();
    } else {
      const ctx = GqlExecutionContext.create(context);
      request = ctx.getContext().req;
    }

    if (!request) {
      throw new UnauthorizedException(
        'No se pudo obtener el objeto de solicitud',
      );
    }

    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization no supported');
    }

    const token = authHeader.split(' ')[1];

    const requiredProfile = this.reflector.getAllAndOverride('profile', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredProfile || requiredProfile.length === 0) {
      return true;
    }

    // Simular decodificación del token
    const decoded = this.mockDecodeToken(token);

    if (!requiredProfile.includes(decoded.tokenType)) {
      throw new UnauthorizedException(
        'Authorization no supported - token inconsistent with profile value',
      );
    }

    if (this.mockBehavior === 'success') {
      request.headers['auth-token'] = {
        ...this.mockSuccessResponse(),
        tokenType: decoded.tokenType,
      };
      request.headers['trackingId'] = uuidv4();
      return true;
    } else {
      this.mockErrorResponse();
    }
  }

  private mockDecodeToken(token: string) {
    // Simular decodificación del token
    return {
      tokenType:
        token === 'valid-token'
          ? ProfileType.Authenticated
          : ProfileType.Not_Authenticated,
    };
  }

  private mockSuccessResponse() {
    return {
      userId: 'mock-user-id',
      username: 'mock-username',
      // Añade aquí cualquier otro dato que necesites simular
    };
  }

  private mockErrorResponse() {
    throw new HttpException(
      {
        errors: [
          {
            details: 'Token validation failed',
          },
        ],
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
