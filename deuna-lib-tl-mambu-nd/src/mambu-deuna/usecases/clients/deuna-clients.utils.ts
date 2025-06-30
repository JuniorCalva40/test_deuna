import { ClientDocumenType } from './deuna-clients.constants';
import { ClientCustom } from './deuna-clients.types';

export class ClientsUtils {
  static mapClientAsOrigin(client: ClientCustom) {
    return {
      origin_client_id: client.idDocuments[0].documentId,
      origin_client_id_type: ClientsUtils.resolveDocumentType(client),
      origin_client_name: client.firstName + client.lastName,
    };
  }

  static mapClientAsBeneficiary(client: ClientCustom) {
    return {
      benficiary_client_id: client.idDocuments[0].documentId,
      benficiary_client_id_type: ClientsUtils.resolveDocumentType(client),
      benficiary_client_name: client.firstName + client.lastName,
    };
  }

  private static resolveDocumentType(client: ClientCustom) {
    return client.idDocuments[0].documentType == ClientDocumenType.CI
      ? 'CEDULA'
      : 'RUC';
  }
}
