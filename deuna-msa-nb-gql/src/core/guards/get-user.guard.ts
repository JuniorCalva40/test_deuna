import { HttpService } from '@nestjs/axios';
import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpStatusCode } from 'axios';
import { lastValueFrom } from 'rxjs';
import { headersBuild } from '../../utils/header.utils';
import { AuthToken } from '../schema/auth-token.schema';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';

/**
 * A guard that retrieves the user's information and performs authorization checks.
 */
@Injectable()
export class GetUserPersonGuard {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * Checks if the user is authorized to access a particular route.
   * @param execContext - The execution context.
   * @returns A boolean indicating whether the user is authorized.
   * @throws UnauthorizedException if the user is not authorized.
   * @throws HttpException if an error occurs while checking the user's authorization.
   */
  async canActivate(execContext: ExecutionContext) {
    let request;

    if (execContext.getType() === 'http') {
      request = execContext.switchToHttp().getRequest();
    } else {
      const ctx = GqlExecutionContext.create(execContext);
      request = ctx.getContext().req;
    }

    if (!request || !request.headers) {
      throw new HttpException(
        'Invalid request context',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const authToken: AuthToken = request.headers['auth-token'];

      const username = authToken?.data?.username || '';
      if (!username)
        throw new UnauthorizedException('the username is not present');
      /*
      const { data: user } = await lastValueFrom(
        this.httpService.get(
          `${this.configService.get('USER_SERVICE_URL')}/user`,
          {
            params: {
              username,
              trackingId: request.headers.trackingId,
              checkUserIsBlocked: true,
            },
            headers: { ...headersBuild(request.headers) },
          },
        ),
      );
      */
      const { data: user } = await lastValueFrom(
        this.httpService.get(
          `${this.configService.get('USER_SERVICE_URL')}/user/identification/${authToken.data.personInfo.identification}`,
          {
            params: {
              trackingId: request.headers.trackingId,
              checkUserIsBlocked: true,
            },
            headers: { ...headersBuild(request.headers) },
          },
        ),
      );
      request.headers['user-person'] = user;
      return !!user;
    } catch (error) {
      if (error.response) {
        if (error.response.data?.errors) {
          error.response.data?.errors?.forEach((element) => {
            throw new UnauthorizedException(
              element.details,
              JSON.stringify(element),
            );
          });
        }
      }

      throw new HttpException(
        `${error.message} - get user person guard`,
        HttpStatusCode.BadRequest,
        {
          cause: error,
        },
      );
    }
  }
}
