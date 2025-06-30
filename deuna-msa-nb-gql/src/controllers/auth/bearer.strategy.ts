import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { JwtPayload } from './bearer.dto';
import { lastValueFrom } from 'rxjs';

/**
 * BearerStrategy class is responsible for validating a bearer token.
 */
@Injectable()
export class BearerStrategy extends PassportStrategy(Strategy) {
  constructor(private httpService: HttpService) {
    super();
  }

  async validate(token: string): Promise<{ payload: JwtPayload }> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post(
          `${process.env.AUTH_SERVICE_URL}/validate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );
      return data;
    } catch (error) {
      throw new UnauthorizedException(error.menssage);
    }
  }
}
