import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AccountDetailComponent } from './account-detail.component';
import { BalanceChartComponent } from '../../components/balance-chart/balance-chart.component';
import { loadAccountDetail, loadMoreTransactions } from '../../store/account-detail/account-detail.actions';
import { Account } from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';

@Component({ selector: 'app-balance-chart', standalone: true, template: '' })
class BalanceChartStub {
  transactions = input<Transaction[]>([]);
}

const mockAccount: Account = {
  id: 1, iban: 'EE123456789012345678', currency: 'EUR', balance: 1304.50, createdAt: '2024-01-01T00:00:00',
};

const mockTransactions: Transaction[] = [
  { id: 1, accountId: 1, amount: 500,  type: 'CREDIT', description: 'Deposit',  balanceAfter: 500,   createdAt: '2024-01-01T10:00:00' },
  { id: 2, accountId: 1, amount: 75.5, type: 'DEBIT',  description: 'Payment',  balanceAfter: 424.5, createdAt: '2024-01-02T10:00:00' },
  { id: 3, accountId: 1, amount: 880,  type: 'CREDIT', description: 'Transfer', balanceAfter: 1304.5, createdAt: '2024-01-03T10:00:00' },
];

const detailState = (overrides: object = {}) => ({
  accountDetail: {
    account: null,
    transactions: [],
    currentPage: 0,
    totalPages: 0,
    loading: true,
    loadingMore: false,
    error: null,
    ...overrides,
  },
});

const loadedState = (overrides: object = {}) =>
  detailState({
    account: mockAccount,
    transactions: mockTransactions,
    totalPages: 1,
    loading: false,
    ...overrides,
  });

describe('AccountDetailComponent', () => {
  let fixture: ComponentFixture<AccountDetailComponent>;
  let store: MockStore;
  let dispatchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountDetailComponent],
      providers: [
        provideRouter([]),
        provideMockStore({ initialState: detailState() }),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
      ],
    })
    .overrideComponent(AccountDetailComponent, {
      remove: { imports: [BalanceChartComponent] },
      add: { imports: [BalanceChartStub] },
    })
    .compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(AccountDetailComponent);
    dispatchSpy = vi.spyOn(store, 'dispatch');
    fixture.detectChanges();
  });

  afterEach(() => vi.clearAllMocks());

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should dispatch loadAccountDetail with the route id on init', () => {
    expect(dispatchSpy).toHaveBeenCalledWith(loadAccountDetail({ id: 1 }));
  });

  it('should show spinner while loading', () => {
    expect(fixture.nativeElement.querySelector('.spinner')).toBeTruthy();
  });

  it('should not render an error banner (navigation on error is handled by the effect)', () => {
    store.setState(detailState({ loading: false, error: 'Something went wrong' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-banner')).toBeFalsy();
    expect(fixture.nativeElement.textContent).not.toContain('Something went wrong');
  });

  it('should show account IBAN when loaded', () => {
    store.setState(loadedState());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('EE123456789012345678');
  });

  it('should format account balance to 2 decimal places', () => {
    store.setState(loadedState({ account: { ...mockAccount, balance: 1304.5 } }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.balance-amount').textContent).toContain('1,304.50');
  });

  it('should render balance-chart when transactions are present', () => {
    store.setState(loadedState());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-balance-chart')).toBeTruthy();
  });

  it('should not render balance-chart when no transactions', () => {
    store.setState(loadedState({ transactions: [] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-balance-chart')).toBeFalsy();
  });

  it('should show empty transactions message when no transactions', () => {
    store.setState(loadedState({ transactions: [] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No transactions yet');
  });

  it('should render a row for each transaction', () => {
    store.setState(loadedState());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.tx-row').length).toBe(mockTransactions.length);
  });

  it('should show + icon and green amount for CREDIT transactions', () => {
    store.setState(loadedState({ transactions: [mockTransactions[0]] }));
    fixture.detectChanges();
    const icon: HTMLElement = fixture.nativeElement.querySelector('.tx-icon--credit');
    const amount: HTMLElement = fixture.nativeElement.querySelector('.tx-amount--credit');
    expect(icon).toBeTruthy();
    expect(amount.textContent).toContain('+');
  });

  it('should show − icon and red amount for DEBIT transactions', () => {
    store.setState(loadedState({ transactions: [mockTransactions[1]] }));
    fixture.detectChanges();
    const icon: HTMLElement = fixture.nativeElement.querySelector('.tx-icon--debit');
    const amount: HTMLElement = fixture.nativeElement.querySelector('.tx-amount--debit');
    expect(icon).toBeTruthy();
    expect(amount.textContent).toContain('−');
  });

  it('should show loading-more spinner when loadingMore is true', () => {
    store.setState(loadedState({ loadingMore: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.spinner-sm')).toBeTruthy();
  });

  it('should dispatch loadMoreTransactions on scroll when not last page', () => {
    store.setState(loadedState({ currentPage: 0, totalPages: 3 }));
    fixture.detectChanges();
    fixture.componentInstance.onScroll();
    expect(dispatchSpy).toHaveBeenCalledWith(loadMoreTransactions({ accountId: 1 }));
  });

  it('should NOT dispatch loadMoreTransactions when already on last page', () => {
    store.setState(loadedState({ currentPage: 0, totalPages: 0 }));
    fixture.detectChanges();
    fixture.componentInstance.onScroll();
    expect(dispatchSpy).not.toHaveBeenCalledWith(loadMoreTransactions({ accountId: 1 }));
  });

  it('should NOT dispatch loadMoreTransactions when loadingMore is true', () => {
    store.setState(loadedState({ currentPage: 0, totalPages: 3, loadingMore: true }));
    fixture.detectChanges();
    fixture.componentInstance.onScroll();
    expect(dispatchSpy).not.toHaveBeenCalledWith(loadMoreTransactions({ accountId: 1 }));
  });
});
