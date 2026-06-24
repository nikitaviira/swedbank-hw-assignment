import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from '../models/account.model';
import { Page, Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>('/api/accounts');
  }

  getAccount(id: number): Observable<Account> {
    return this.http.get<Account>(`/api/accounts/${id}`);
  }

  getTransactions(id: number, page: number, size = 20): Observable<Page<Transaction>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,DESC');
    return this.http.get<Page<Transaction>>(`/api/accounts/${id}/transactions`, { params });
  }
}
