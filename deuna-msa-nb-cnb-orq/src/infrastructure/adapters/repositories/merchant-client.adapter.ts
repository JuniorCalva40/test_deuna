import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MerchantClientPort } from "@src/application/ports/out/clients/merchant-client.port";
import { Logger } from '@deuna/tl-logger-nd';
import { firstValueFrom } from "rxjs";

type ClientDto = {
    id: string;
};

@Injectable()
export class MerchantClientAdapter implements MerchantClientPort {
    private readonly configServiceUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly logger: Logger,
    ) {
        this.configServiceUrl =
            this.configService.get<string>('BO_MERCHANT_CLIENT_SERVICE');

        if (!this.configServiceUrl) {
            this.logger.error(
                'error | MerchantClientAdapter | constructor',
                'BO_MERCHANT_CLIENT_SERVICE is not defined',
            );
            throw new Error('BO_MERCHANT_CLIENT_SERVICE is not defined');
        }
    }

    async getClientData(identificationNumber: string): Promise<{
        clientId: string;
    }> {
        try {
            this.logger.log(
                `init | MerchantClientAdapter | getClientData | request: ${identificationNumber}`,
            );

            const response = await firstValueFrom(
                this.httpService.get<ClientDto>(
                    `${this.configServiceUrl}/client/ruc/${identificationNumber}`,
                )
            );

            this.logger.log(
                `finish | MerchantClientAdapter | getClientData | response: ${JSON.stringify(
                    response.data,
                )}`,
            );

            return {
                clientId: response.data.id,
            };
        } catch (error) {
            this.logger.error(
                'error | MerchantClientAdapter | getClientData',
                error,
            );
            throw new Error(`Failed to get merchant client data: ${error.message}`);
        }
    }

}