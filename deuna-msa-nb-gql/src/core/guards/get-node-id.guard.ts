import { HttpService } from '@nestjs/axios';
import {
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { lastValueFrom } from 'rxjs';
import { HttpStatusCode } from 'axios';
import { ConfigService } from '@nestjs/config';
import { ClientInfo } from '../schema/merchat-client.schema';

@Injectable()
export class GetNodeIdGuard {
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

      const clientInfo: ClientInfo = request.headers['client-info'];
      const merchantId = clientInfo?.id;

      if (!merchantId) {
        throw new UnauthorizedException('MerchantId not found in client info');
      }

      const hierarchyUrl = this.configService.get<string>(
        'HIERARCHY_SERVICE_URL',
      );

      const { data: hierarchyResponse } = await lastValueFrom(
        this.httpService.get(
          `${hierarchyUrl}/hierarchy?clientId=${merchantId}&nodeType=M&status=A&page=1&limit=10`,
        ),
      );

      if (!hierarchyResponse?.items?.length) {
        throw new UnauthorizedException('No nodes found for merchant');
      }

      const nodeId = hierarchyResponse.items[0].id;
      request.headers['node-id'] = nodeId;

      return true;
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((element) => {
          throw new HttpException(element.details, HttpStatusCode.BadRequest, {
            cause: error,
          });
        });
      }

      throw new UnauthorizedException(
        `${error.message} - get node id guard`,
        error,
      );
    }
  }
}
