export type TransactionType = 'CREDIT' | 'DEBIT' | 'EXCHANGE';

export interface Transaction {
  id: number;
  accountId: number;
  amount: number;
  type: TransactionType;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  last: boolean;
}
