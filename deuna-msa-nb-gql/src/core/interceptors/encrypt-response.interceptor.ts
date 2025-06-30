import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthToken } from '../schema/auth-token.schema';
import { generateEncryptHashResponse } from '../../utils/utils';

/**
 * Interceptor that encrypts the response data and adds a hash to the response header.
 */
@Injectable()
export class EncryptInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    let user = new AuthToken();

    user = context.switchToHttp().getRequest().headers['auth-token']; // solo autoken
    return next.handle().pipe(
      map((data) => {
        const hashEncryptBody = generateEncryptHashResponse(
          data,
          user.signature,
        );
        const response = context.switchToHttp().getResponse();
        response.header('x-deuna-business-hash', hashEncryptBody);
        return data;
      }),
    );
  }
}
