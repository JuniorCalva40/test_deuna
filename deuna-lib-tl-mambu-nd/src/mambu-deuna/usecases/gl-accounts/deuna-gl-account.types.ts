import { GLAccountCreateJornalEntryRS } from '../../../mambu-core/usecases/gl-accounts/gl-account.types';

export class GLAccountMovementRQ {
  branch?: Branch;
  origin: GLBeneficiary;
  beneficiary: GLBeneficiary;
  amount: number;
  notes?: string;
  date?: Date;
}

export class GLBeneficiary {
  glAccount: Branch;
}

export class Branch {
  id: string;
}

export class GLAccountMovementRS {
  origin: GLAccountCreateJornalEntryRS;
  beneficiary: GLAccountCreateJornalEntryRS;
}
