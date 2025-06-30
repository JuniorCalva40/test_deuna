import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@deuna/tl-logger-nd';
import { firstValueFrom } from 'rxjs';
import { CnbConfigUpdatePort } from '@src/application/ports/out/clients/cnb-config-update.port';
import { CnbConfigurationItem } from '@src/application/dto/cnb-configurations-request.dto';

@Injectable()
export class CnbConfigUpdateAdapter implements CnbConfigUpdatePort {
    private readonly baseUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly logger: Logger,
    ) {
        this.baseUrl = this.configService.get<string>('CONFIG_SERVICE_URL');

        if (!this.baseUrl) {
            this.logger.error(
                'error | CnbConfigUpdateAdapter | constructor',
                'CONFIG_SERVICE_URL is not defined',
            );
            throw new Error('CONFIG_SERVICE_URL is not defined');
        }
    }

    async updateCnbConfig(
        configId: string,
        configItem: CnbConfigurationItem,
    ): Promise<void> {
        const url = `${this.baseUrl}/configuration/${configId}`;
        try {
            this.logger.log(
                `init | CnbConfigUpdateAdapter | updateCnbConfig | PUT ${url} | data: ${JSON.stringify(
                    configItem,
                )}`,
            );

            const response = await firstValueFrom(
                this.httpService.put(url, configItem),
            );

            this.logger.log(
                `finish | CnbConfigUpdateAdapter | updateCnbConfig | status: ${response.status}`,
            );
        } catch (error) {
            const message =
                error?.response?.data?.message || error.message || 'Unknown error';
            const status = error?.response?.status || 'no-status';

            this.logger.error(
                `error | CnbConfigUpdateAdapter | updateCnbConfig | status: ${status} | message: ${message}`,
            );
            throw new Error(`Failed to update config: ${error.message}`);
        }
    }
}