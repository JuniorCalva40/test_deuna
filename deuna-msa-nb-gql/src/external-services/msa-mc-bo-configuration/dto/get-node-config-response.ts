import { ClientType } from '@deuna/mc-bo-common-nd';

export class GetNodeConfigResponse {
  id: string;

  nodeId?: string;

  configName: string;

  configData: Record<string, unknown>;

  clientType: ClientType;

  encrypted?: boolean;
}
