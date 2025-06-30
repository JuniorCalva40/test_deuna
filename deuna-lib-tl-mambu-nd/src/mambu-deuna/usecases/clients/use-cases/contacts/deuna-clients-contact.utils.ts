import { EditionField, MambuOps } from '../../../../../mambu-core/mambu.types';
import { ClientFields } from '../../../../../mambu-core/usecases/clients/client.constants';

export class ClientContactsUtils {
  static phoneEditionFields(phoneNumber: string): EditionField<string>[] {
    return [
      {
        op: MambuOps.ADD,
        path: ClientFields.HOME_PHONE,
        value: phoneNumber,
      },
      {
        op: MambuOps.ADD,
        path: ClientFields.MOBILE_PHONE,
        value: phoneNumber,
      },
      {
        op: MambuOps.ADD,
        path: ClientFields.MOBILE_PHONE_2,
        value: phoneNumber,
      },
    ];
  }

  static emailEditionFields(email: string): EditionField<string>[] {
    return [
      {
        op: MambuOps.ADD,
        path: ClientFields.EMAIL_ADDRESS,
        value: email,
      },
    ];
  }
}
