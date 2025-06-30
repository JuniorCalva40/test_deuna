import { Logger } from '@deuna/tl-logger-nd';
import { MerchantClientPort } from '../../ports/out/clients/merchant-client.port';

export class MerchantClientUseCase {
    constructor(
        private readonly merchantClientPort: MerchantClientPort,
        private readonly logger: Logger,
    ) { }

    async execute(
        identificationNumber: string,
    ): Promise<string> {
        try {
            this.logger.log(
                `init | MerchantClientUseCase | execute | request: ${identificationNumber}`,
            );

            const response = await this.merchantClientPort.getClientData(identificationNumber);

            this.logger.log(
                `finish | MerchantClientUseCase | execute | response: ${JSON.stringify(
                    response,
                )}`,
            );

            return response.clientId;
        } catch (error) {
            this.logger.error('error | MerchantClientUseCase | execute', error);
            throw error;
        }
    }
}