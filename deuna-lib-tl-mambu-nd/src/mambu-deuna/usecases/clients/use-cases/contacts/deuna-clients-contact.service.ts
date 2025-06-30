import { Injectable } from '@nestjs/common';
import {
  ClientUpdateContact,
  ClientUpdateEmail,
  ClientUdatePhone as ClientUpdatePhone,
} from './deuna-clients-contact.types';
import { ClientContactsUtils } from './deuna-clients-contact.utils';
import { ClientService } from '../../../../../mambu-core/usecases/clients/client.service';
import { LogDeunaMambu } from '../../../../utils/deuna-mambu-logger';

@Injectable()
export class DeunaClientContactService {
  constructor(private clientService: ClientService) {}

  @LogDeunaMambu()
  async updatePhoneNumber(clientUpdatePhone: ClientUpdatePhone) {
    const { clientId, phoneNumber } = clientUpdatePhone;
    return await this.clientService.update(
      clientId,
      ClientContactsUtils.phoneEditionFields(phoneNumber),
    );
  }

  @LogDeunaMambu()
  async updateEmail(clientUpdateEmail: ClientUpdateEmail) {
    const { clientId, email } = clientUpdateEmail;
    return await this.clientService.update(
      clientId,
      ClientContactsUtils.emailEditionFields(email),
    );
  }

  @LogDeunaMambu()
  async updateContact(clientUpdateContact: ClientUpdateContact) {
    const { clientId, contact } = clientUpdateContact;
    return await this.clientService.update(clientId, [
      ...ClientContactsUtils.phoneEditionFields(contact.phoneNumber),
      ...ClientContactsUtils.emailEditionFields(contact.email),
    ]);
  }
}
