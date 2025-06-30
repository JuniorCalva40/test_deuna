export class Contact {
  phoneNumber: string;
  email: string;
}

export class ClientUpdateContact {
  clientId: string;
  contact: Contact;
}

export class ClientUdatePhone {
  clientId: string;
  phoneNumber: string;
}

export class ClientUpdateEmail {
  clientId: string;
  email: string;
}
