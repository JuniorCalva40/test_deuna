import { Observable } from 'rxjs';
import { GetNodeConfigResponse } from '../dto/get-node-config-response';
import { McBoConfigCnbAddressDto } from '../dto/get-config-cnb-address.dto';
export interface IMsaMcBoConfigurationService {
  getConfigCnbState(nodeId: string): Observable<GetNodeConfigResponse>;
  getConfigCnbAddress(nodeId: string): Observable<McBoConfigCnbAddressDto>;
  getNodeConfigByCode(
    nodeId: string,
    configCode: string,
  ): Observable<GetNodeConfigResponse>; // Añadido
}

export { IMsaMcBoConfigurationService as default };
