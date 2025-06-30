import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MerchantHierarchyPort } from "@src/application/ports/out/clients/merchant-hierarchy.port";
import { Logger } from '@deuna/tl-logger-nd';
import { firstValueFrom } from "rxjs";

@Injectable()
export class MerchantHierarchyAdapter implements MerchantHierarchyPort {
    private readonly configServiceUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly logger: Logger,
    ) {
        this.configServiceUrl =
            this.configService.get<string>('BO_MERCHANT_HIERARCHY_SERVICE');

        if (!this.configServiceUrl) {
            this.logger.error(
                'error | MerchantHierarchyAdapter | constructor',
                'BO_MERCHANT_HIERARCHY_SERVICE is not defined',
            );
            throw new Error('BO_MERCHANT_HIERARCHY_SERVICE is not defined');
        }
    }

    async getNodeId(clientId: string): Promise<{ nodeId: string }> {
        try {
            this.logger.log(
                `init | MerchantHierarchyAdapter | getNodeId | request: ${clientId}`,
            );

            const hierarchyUrl = `${this.configServiceUrl}/hierarchy?clientId=${clientId}&nodeType=M&status=A&page=1&limit=10`;

            const response = await firstValueFrom(
                this.httpService.get<{ items: { id: number; createdAt: string }[] }>(
                    hierarchyUrl,
                ),
            );

            this.logger.log(
                `finish | MerchantHierarchyAdapter | getNodeId | response: ${JSON.stringify(
                    response.data,
                )}`,
            );

            const mostRecentItem = response.data.items
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            if (!mostRecentItem) {
                throw new Error('No active nodeType M found for client');
            }

            return {
                nodeId: mostRecentItem.id.toString(),
            };
        } catch (error) {
            this.logger.error(
                'error | MerchantHierarchyAdapter | getNodeId',
                error,
            );
            throw new Error(`Failed to get merchant client data: ${error.message}`);
        }
    }

}