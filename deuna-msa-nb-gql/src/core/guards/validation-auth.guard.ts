import {
  ExecutionContext,
  HttpException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { decodeToken } from '../../utils/header.utils';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';

export const PROFILE_KEY = 'profile';
export const Profile = (...roles: ProfileType[]) =>
  SetMetadata(PROFILE_KEY, roles);
export enum ProfileType {
  Authenticated = 'LOGIN',
}
/**
 * ValidationAuthGuard class.
 *
 * This class extends the AuthGuard class and implements the canActivate method to provide authentication and authorization functionality.
 * It checks the request for a valid JWT token and verifies if the token's profile matches the required profile for accessing the route.
 * If the token is valid and the profile matches, it sends a request to the anonymous authentication service to validate the token.
 * If the token is invalid or the profile doesn't match, it throws an UnauthorizedException.
 * If the token is valid and the profile matches, it adds the token information to the request headers and returns true to allow access.
 * If there is an error during the validation process, it throws an HttpException with the error details.
 *
 * @public
 * @class
 * @extends AuthGuard
 */
@Injectable()
export class ValidationAuthGuard extends AuthGuard('jwt') {
  constructor(
    private httpService: HttpService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    super();
  }

  protected logError(message: string, error: any) {
    console.error(message, error.message || 'Unknown error');
  }

  public setLogErrorFunction(func: (message: string, error: any) => void) {
    this.logError = func;
  }

  /**
   * Checks if the user is authorized to access the requested route.
   *
   * @param context - The execution context.
   * @returns A boolean indicating whether the user is authorized or not.
   * @throws UnauthorizedException if the user is not authorized.
   */
  async canActivate(context: ExecutionContext) {
    let request;

    if (context.getType() === 'http') {
      request = context.switchToHttp().getRequest();
    } else {
      // Para contextos GraphQL
      const ctx = GqlExecutionContext.create(context);
      request = ctx.getContext().req;
    }

    if (!request) {
      throw new UnauthorizedException(
        'No se pudo obtener el objeto de solicitud',
      );
    }

    const authHeader = request.headers['authorization'];
    const contextInfo = GqlExecutionContext.create(context).getInfo();
    const routePath = `gql/cnb/${contextInfo.path.key}`;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization no supported');
    }
    const token = authHeader.split(' ')[1];

    const requiredProfile = this.reflector.getAllAndOverride<string[]>(
      PROFILE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si requiredProfile es undefined o un array vacío, permitir el acceso
    if (!requiredProfile || requiredProfile.length === 0) {
      return true;
    }

    let decoded: { tokenType: string };
    try {
      decoded = decodeToken(token, this.configService);
      if (!requiredProfile.includes(decoded.tokenType)) {
        throw new UnauthorizedException(
          'Authorization no supported - token inconsistent with profile value',
        );
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    try {
      const rquestUrl = `${this.configService.get('MSA_CO_AUTH_URL')}/microcommerce-auth/validate-token`;
      const response = await lastValueFrom(
        this.httpService.post(rquestUrl, {
          authorization: token,
          accessPath: routePath,
        }),
      );
      request.headers['auth-token'] = {
        ...response.data,
        tokenType: decoded.tokenType,
      };
      request.headers['trackingId'] = uuidv4();
      return true;
    } catch (error) {
      if (error.response) {
        const signature = error.response.headers['auth-signature'];
        const deviceid = error.response.headers['auth-deviceid'];
        const sessionid = error.response.headers['auth-sessionid'];
        if (error.response.data?.errors) {
          error.response.data?.errors?.forEach((element) => {
            if (sessionid && deviceid && signature) {
              request.headers['auth-token'] = {
                sessionId: sessionid,
                deviceId: deviceid,
                signature: signature,
              };
            }
            throw new HttpException(element.details, error.response.status);
          });
        }
      }
    }
  }
}
