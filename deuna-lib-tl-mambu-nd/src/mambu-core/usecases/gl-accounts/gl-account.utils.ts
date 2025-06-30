import { GLJournalEntryType } from './gl-account.constants';
import { GLAccountCreateJornalEntryRS } from './gl-account.types';

export class GLAccountUtils {
  static findDebit(
    glAccountCreateJornalEntryRS: GLAccountCreateJornalEntryRS[],
  ): GLAccountCreateJornalEntryRS {
    return glAccountCreateJornalEntryRS.find(
      (entry) => entry.type == GLJournalEntryType.DEBIT,
    );
  }

  static findCredit(
    glAccountCreateJornalEntryRS: GLAccountCreateJornalEntryRS[],
  ): GLAccountCreateJornalEntryRS {
    return glAccountCreateJornalEntryRS.find(
      (entry) => entry.type == GLJournalEntryType.CREDIT,
    );
  }
}
