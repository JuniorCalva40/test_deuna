import { Client } from '../../../mambu-core/usecases/clients/client.types';

export interface ClientCustom extends Client {
  _client_anchorage_detail?: ClientAnchorageDetail;
  _additional_data_client?: AdditionalDataClient;
}

export interface AdditionalDataClient {
  client_segment: string;
  client_type: string;
}

export interface ClientAnchorageDetail {
  _client_anchorage_id: string;
}

export class ClientChangeBranch {
  clientId: string;
  branchId: string;
  centerId: string;
}
