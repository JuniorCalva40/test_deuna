import { MambuDomain } from "../../../mambu-core/config/constants/mambu.constants";

export const CUSTOM_FIELDS = {
  [MambuDomain.ACCOUNTS]: {
    subState: {
      section: '/_account_state_detail',
      customFields: {
        lastStateDate: 'last_state_date',
        currentState: 'current_state',
        stateBalance: 'state_balance',
        externalTrxId: 'external_trx_id',
      },
    },
    process: {
      section: '/_process_details',
      customFields: {
        id: 'process_id',
        name: 'process_name',
      },
    },
  },
  [MambuDomain.DEPOSIT_TRANSACTIONS]: {},
  [MambuDomain.CLIENTS]: {
    centerOfCosts: {
      section: '_client_anchorage_detail',
      customFields: {
        id: '_client_anchorage_id',
      },
    },
  },
};
