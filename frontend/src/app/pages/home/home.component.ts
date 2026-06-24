import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { loadAccounts } from '../../store/accounts/accounts.actions';
import { selectAccounts, selectAccountsError, selectAccountsLoading } from '../../store/accounts/accounts.selectors';
import { ErrorBannerComponent } from '../../components/error-banner/error-banner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, RouterLink, ErrorBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">
      <app-error-banner [message]="error()" (dismissed)="dismiss()" />
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
        } @else if ((accounts$ | async); as accounts) {
          @if (accounts.length === 0) {
            <div class="state-message">
              <span>There are no accounts currently. Open Swagger and create some accounts.</span>
            </div>
          } @else {
            <div class="accounts-grid">
              @for (account of accounts; track account.id) {
                <a class="account-card" [routerLink]="['/accounts', account.id]">
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
                </a>
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
      transition: border-color 0.2s, background 0.2s;
      text-decoration: none;
      cursor: pointer;
    }

    .account-card:hover {
      border-color: rgba(255,255,255,0.14);
      background: #242a3d;
    }

    .card-top {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

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

  private readonly navError = signal<string | null>((history.state as { error?: string })?.error ?? null);
  private readonly storeError = toSignal(this.store.select(selectAccountsError), { initialValue: null as string | null });
  error = computed(() => this.navError() || this.storeError() || null);

  dismiss(): void {
    this.navError.set(null);
  }

  ngOnInit(): void {
    this.store.dispatch(loadAccounts());
  }
}
