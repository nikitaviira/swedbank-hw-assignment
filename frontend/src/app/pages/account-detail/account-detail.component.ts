import {
  ChangeDetectionStrategy, Component, HostListener, inject, OnInit,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Transaction } from '../../models/transaction.model';
import { loadAccountDetail, loadMoreTransactions, selectTransaction } from '../../store/account-detail/account-detail.actions';
import {
  selectAccountDetail,
  selectAccountDetailIsLast,
  selectAccountDetailLoading,
  selectAccountDetailLoadingMore,
  selectAccountDetailTransactions,
} from '../../store/account-detail/account-detail.selectors';
import { BalanceChartComponent } from '../../components/balance-chart/balance-chart.component';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [DecimalPipe, DatePipe, RouterLink, BalanceChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="nav">
        <a routerLink="/" class="back-link">← Accounts</a>
      </div>

      @if (loading()) {
        <div class="center-state">
          <div class="spinner"></div>
          <span>Loading…</span>
        </div>
      } @else {
        <div class="account-header">
          <div class="currency-badge" [attr.data-currency]="account()?.currency">
            {{ account()?.currency }}
          </div>
          <div class="account-info">
            <span class="iban">{{ account()?.iban }}</span>
            <div class="balance-row">
              <span class="balance-amount">{{ account()?.balance | number: '1.2-2' }}</span>
              <span class="balance-currency">{{ account()?.currency }}</span>
            </div>
          </div>
        </div>

        @if (transactions().length > 0) {
          <section class="section">
            <h2 class="section-title">Balance History</h2>
            <app-balance-chart [transactions]="transactions()" />
          </section>
        }

        <section class="section">
          <h2 class="section-title">Transactions</h2>
          @if (transactions().length === 0) {
            <p class="empty">No transactions yet.</p>
          } @else {
            <div class="tx-list">
              @for (tx of transactions(); track tx.id) {
                <a class="tx-row"
                   [routerLink]="['/accounts', account()?.id, 'transactions', tx.id]"
                   (click)="onSelectTransaction(tx)">
                  <div class="tx-icon" [class]="'tx-icon--' + tx.type.toLowerCase()">
                    {{ tx.type === 'DEBIT' ? '−' : '+' }}
                  </div>
                  <div class="tx-details">
                    <span class="tx-desc">{{ tx.description }}</span>
                    <span class="tx-date">{{ tx.createdAt | date: 'dd MMM yyyy, HH:mm' }}</span>
                  </div>
                  <div class="tx-amount" [class]="'tx-amount--' + tx.type.toLowerCase()">
                    {{ tx.type === 'DEBIT' ? '−' : '+' }}{{ tx.amount | number: '1.2-2' }}
                  </div>
                </a>
              }
            </div>
            @if (loadingMore()) {
              <div class="loading-more">
                <div class="spinner-sm"></div>
              </div>
            }
          }
        </section>
      }
    </div>
  `,
  styles: [
    `
      .page {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1.5rem 4rem;
      }

      .nav {
        margin-bottom: 2rem;
      }

      .back-link {
        color: rgba(255, 255, 255, 0.5);
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        transition: color 0.15s;
      }

      .back-link:hover {
        color: #ffffff;
      }

      .center-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 5rem 0;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.9375rem;
      }

      .spinner {
        width: 1.5rem;
        height: 1.5rem;
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-top-color: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .account-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2.5rem;
      }

      .account-header .currency-badge {
        --badge-size: 3rem;
        --badge-font-size: 0.75rem;
      }

      .account-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .iban {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.4);
        font-family: 'SF Mono', 'Fira Code', monospace;
        letter-spacing: 0.04em;
      }

      .balance-row {
        display: flex;
        align-items: baseline;
        gap: 0.4rem;
      }

      .balance-amount {
        font-size: 2.25rem;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: -0.04em;
        line-height: 1;
      }

      .balance-currency {
        font-size: 1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        letter-spacing: 0.02em;
      }

      .section {
        margin-bottom: 2rem;
      }

      .section-title {
        font-size: 0.8125rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 1rem;
      }

      .tx-list {
        display: flex;
        flex-direction: column;
      }

      .tx-row {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        padding: 0.875rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        text-decoration: none;
        cursor: pointer;
        transition: background 0.15s;
        border-radius: 6px;
        margin: 0 -0.5rem;
        padding-left: 0.5rem;
        padding-right: 0.5rem;
      }

      .tx-row:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      .tx-row:last-child {
        border-bottom: none;
      }

      .tx-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        font-size: 0.875rem;
        font-weight: 700;
        flex-shrink: 0;
      }

      .tx-icon--credit {
        background: rgba(52, 199, 89, 0.12);
        color: #34c759;
      }
      .tx-icon--debit {
        background: rgba(248, 113, 113, 0.12);
        color: #f87171;
      }
      .tx-icon--exchange {
        background: rgba(79, 99, 216, 0.12);
        color: #6c7ee1;
      }

      .tx-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 0;
      }

      .tx-desc {
        font-size: 0.9375rem;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .tx-date {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
      }

      .tx-amount {
        font-size: 0.9375rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .tx-amount--credit {
        color: #34c759;
      }
      .tx-amount--debit {
        color: #f87171;
      }
      .tx-amount--exchange {
        color: #6c7ee1;
      }

      .loading-more {
        display: flex;
        justify-content: center;
        padding: 1.5rem 0;
      }

      .spinner-sm {
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-top-color: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }

      .empty {
        color: rgba(255, 255, 255, 0.35);
        font-size: 0.9375rem;
        padding: 1.5rem 0;
      }
    `,
  ],
})
export class AccountDetailComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  private accountId!: number;

  loading = toSignal(this.store.select(selectAccountDetailLoading), { initialValue: true });
  account = toSignal(this.store.select(selectAccountDetail));
  transactions = toSignal(this.store.select(selectAccountDetailTransactions), {
    initialValue: [] as Transaction[],
  });
  loadingMore = toSignal(this.store.select(selectAccountDetailLoadingMore), {
    initialValue: false,
  });
  isLast = toSignal(this.store.select(selectAccountDetailIsLast), { initialValue: true });

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.loadingMore() || this.isLast()) return;
    const scrolled = window.scrollY + window.innerHeight;
    if (scrolled >= document.documentElement.scrollHeight - 300) {
      this.store.dispatch(loadMoreTransactions({ accountId: this.accountId }));
    }
  }

  onSelectTransaction(tx: Transaction): void {
    this.store.dispatch(selectTransaction({ transaction: tx }));
  }

  ngOnInit(): void {
    this.accountId = +this.route.snapshot.paramMap.get('id')!;
    this.store.dispatch(loadAccountDetail({ id: this.accountId }));
  }
}
