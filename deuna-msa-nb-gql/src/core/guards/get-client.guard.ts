import { HttpService } from '@nestjs/axios';
import {
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthToken } from '../schema/auth-token.schema';
import { lastValueFrom } from 'rxjs';
import { HttpStatusCode } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GetClientGuard {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async canActivate(execContext: ExecutionContext) {
    try {
      let request;
      if (execContext.getType() === 'http') {
        request = execContext.switchToHttp().getRequest();
      } else {
        const ctx = GqlExecutionContext.create(execContext);
        request = ctx.getContext().req;
      }

      const authtoken: AuthToken = request.headers['auth-token'];
      const identification = authtoken.data.personInfo?.identification;
      if (!identification)
        throw new UnauthorizedException('The identification is not in session');
      const { data: client } = await lastValueFrom(
        this.httpService.get(
          `${this.configService.get('MSA_MC_BO_CLIENT_SERVICE_URL')}/client/ruc/${identification}`,
        ),
      );
      request.headers['client-info'] = client;
      return !!client;
    } catch (error) {
      if (error.response) {
        if (error.response.data?.errors) {
          error.response.data?.errors?.forEach((element) => {
            throw new HttpException(
              element.details,
              HttpStatusCode.BadRequest,
              {
                cause: error,
              },
            );
          });
        }
      }

      throw new UnauthorizedException(
        `${error.message} - get client info guard`,
        error,
      );
    }
  }
}
