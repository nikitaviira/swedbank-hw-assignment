import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { loadAccounts } from '../../store/accounts/accounts.actions';
import { selectAccounts, selectAccountsError, selectAccountsLoading } from '../../store/accounts/accounts.selectors';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">
      <header class="home-header">
        <h1 class="home-title">Accounts</h1>
        @if ((accounts$ | async); as accounts) {
          <span class="account-count">
            {{ accounts.length }} account{{ accounts.length !== 1 ? 's' : '' }}
          </span>
        }
      </header>

      <div class="accounts-container">
        @if (loading$ | async) {
          <div class="state-message">
            <div class="spinner"></div>
            <span>Loading accounts…</span>
          </div>
        } @else if (error$ | async; as error) {
          <div class="state-message error">
            <span class="error-icon">!</span>
            <span>{{ error }}</span>
          </div>
        } @else if ((accounts$ | async); as accounts) {
          @if (accounts.length === 0) {
            <div class="state-message">
              <span>There are no accounts currently. Open Swagger and create some accounts.</span>
            </div>
          } @else {
            <div class="accounts-grid">
              @for (account of accounts; track account.id) {
                <div class="account-card">
                  <div class="card-top">
                    <div class="currency-badge" [attr.data-currency]="account.currency">
                      {{ account.currency }}
                    </div>
                    <span class="iban">{{ account.iban }}</span>
                  </div>
                  <div class="card-bottom">
                    <span class="balance">{{ account.balance | number:'1.2-2' }}</span>
                    <span class="currency-label">{{ account.currency }}</span>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .home {
      max-width: 800px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
    }

    .home-header {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .home-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.03em;
    }

    .account-count {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.4);
      font-weight: 500;
    }

    .accounts-container {
      display: flex;
      flex-direction: column;
    }

    .state-message {
      display: flex;
      font-weight: bold;
      align-items: center;
      gap: 0.75rem;
      color: rgba(255,255,255,0.5);
      font-size: 0.9375rem;
      padding: 3rem 0;
      justify-content: center;
    }

    .state-message.error {
      color: #f87171;
    }

    .error-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: rgba(248,113,113,0.15);
      font-size: 0.8rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .spinner {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: rgba(255,255,255,0.6);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .accounts-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .account-card {
      background: #1e2330;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 1.5rem 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      transition: border-color 0.2s;
    }

    .account-card:hover {
      border-color: rgba(255,255,255,0.12);
    }

    .card-top {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .currency-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      flex-shrink: 0;
    }

    .currency-badge[data-currency="EUR"] { background: rgba(255,214,0,0.12); color: #ffd600; }
    .currency-badge[data-currency="USD"] { background: rgba(52,199,89,0.12); color: #34c759; }
    .currency-badge[data-currency="GBP"] { background: rgba(10,132,255,0.12); color: #0a84ff; }
    .currency-badge[data-currency="SEK"] { background: rgba(255,149,0,0.12); color: #ff9500; }
    .currency-badge[data-currency="VND"] { background: rgba(255,59,48,0.12); color: #ff3b30; }

    .iban {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.5);
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
      letter-spacing: 0.04em;
    }

    .card-bottom {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .balance {
      font-size: 1.875rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.04em;
      line-height: 1;
    }

    .currency-label {
      font-size: 0.9375rem;
      font-weight: 600;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.02em;
    }
  `],
})
export class HomeComponent implements OnInit {
  private readonly store = inject(Store);

  accounts$ = this.store.select(selectAccounts);
  loading$ = this.store.select(selectAccountsLoading);
  error$ = this.store.select(selectAccountsError);

  ngOnInit(): void {
    this.store.dispatch(loadAccounts());
  }
}
