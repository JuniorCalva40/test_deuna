export class GLAccountCreateJornalEntryRQ {
  branchId?: string;
  credits: GLAccountAmount[];
  date: string;
  debits: GLAccountAmount[];
  notes?: string;
}

export class GLAccountAmount {
  amount: number;
  glAccount: string;
}

export interface GLAccountCreateJornalEntryRS {
  encodedKey: string;
  entryID: number;
  creationDate: Date;
  bookingDate: Date;
  transactionId: string;
  amount: number;
  glAccount: GlAccount;
  type: string;
  userKey: string;
  notes: string;
}

export interface GlAccount {
  encodedKey: string;
  creationDate: Date;
  lastModifiedDate: Date;
  glCode: string;
  type: string;
  usage: string;
  name: string;
  activated: boolean;
  description: string;
  allowManualJournalEntries: boolean;
  stripTrailingZeros: boolean;
  currency: Currency;
}

export interface Currency {
  currencyCode: string;
  code: string;
}
