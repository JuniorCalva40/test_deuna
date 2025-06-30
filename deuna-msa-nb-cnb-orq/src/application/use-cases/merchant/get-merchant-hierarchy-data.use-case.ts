import { Logger } from '@deuna/tl-logger-nd';
import { MerchantHierarchyPort } from '../../ports/out/clients/merchant-hierarchy.port';

export class MerchantHierarchyUseCase {
    constructor(
        private readonly merchantHierarchyPort: MerchantHierarchyPort,
        private readonly logger: Logger,
    ) { }

    async execute(
        clientId: string,
    ): Promise<string> {
        try {
            this.logger.log(
                `init | MerchantHierarchyUseCase | execute | request: ${clientId}`,
            );

            const response = await this.merchantHierarchyPort.getNodeId(clientId);

            this.logger.log(
                `finish | MerchantHierarchyUseCase | execute | response: ${JSON.stringify(
                    response,
                )}`,
            );

            return response.nodeId;
        } catch (error) {
            this.logger.error('error | MerchantHierarchyUseCase | execute', error);
            throw error;
        }
    }
} 