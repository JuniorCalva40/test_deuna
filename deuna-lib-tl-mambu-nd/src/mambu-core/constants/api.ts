import { MambuDomain } from '../config/constants/mambu.constants';

export const endpoints = {
  deposits: 'deposits',
  transactions: 'transactions',
  clients: 'clients',
  gljournalentries: 'gljournalentries',
};

export const actions = {
  search: 'search',
  deposit: 'deposit',
  withdrawal: 'withdrawal',
};

export const ACTIONS = {
  [MambuDomain.ACCOUNTS]: {
    changeInterestRate: 'changeInterestRate',
    applyInterest: 'applyInterest',
    changeState: 'changeState',
  },
};
