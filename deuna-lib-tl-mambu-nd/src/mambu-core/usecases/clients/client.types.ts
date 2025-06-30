export interface Client {
  encodedKey: string;
  id: string;
  state: string;
  creationDate: Date;
  lastModifiedDate: Date;
  approvedDate: Date;
  firstName: string;
  lastName: string;
  mobilePhone: string;
  emailAddress: string;
  preferredLanguage: string;
  assignedBranchKey: string;
  assignedCentreKey: string;
  clientRoleKey: string;
  loanCycle: number;
  groupLoanCycle: number;
  groupKeys: any[];
  addresses: any[];
  idDocuments: IDDocument[];
}

export interface IDDocument {
  encodedKey: string;
  clientKey: string;
  documentType: string;
  documentId: string;
  validUntil: Date;
  indexInList: number;
}
