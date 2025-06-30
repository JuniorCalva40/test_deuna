export interface CnbConfigurationItem {
  nodeId: string;
  configName: string;
  configData: any;
  encrypted: boolean;
  clientType: string;
}

export class CnbConfigurationsRequestDto {
  configurations: CnbConfigurationItem[];
} 