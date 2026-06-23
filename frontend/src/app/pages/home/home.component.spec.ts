import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { HomeComponent } from './home.component';
import { loadAccounts } from '../../store/accounts/accounts.actions';
import { Account } from '../../models/account.model';

const mockAccounts: Account[] = [
  { id: 1, iban: 'EE123456789012345678', currency: 'EUR', balance: 100.5, createdAt: '2024-01-01T10:00:00' },
  { id: 2, iban: 'EE987654321098765432', currency: 'USD', balance: 0, createdAt: '2024-01-02T10:00:00' },
];

const accountsState = (overrides: object = {}) => ({
  accounts: { accounts: [], loading: false, error: null, ...overrides },
});

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let store: MockStore;
  let dispatchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideMockStore({ initialState: accountsState() }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(HomeComponent);
    dispatchSpy = vi.spyOn(store, 'dispatch');
    fixture.detectChanges();
  });

  afterEach(() => vi.clearAllMocks());

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should dispatch loadAccounts on init', () => {
    expect(dispatchSpy).toHaveBeenCalledWith(loadAccounts());
  });

  it('should show spinner while loading', () => {
    store.setState(accountsState({ loading: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.spinner')).toBeTruthy();
  });

  it('should hide spinner when not loading', () => {
    store.setState(accountsState({ loading: false }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.spinner')).toBeFalsy();
  });

  it('should show empty-state message when accounts list is empty', () => {
    store.setState(accountsState({ accounts: [] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('There are no accounts currently');
  });

  it('should render one card per account', () => {
    store.setState(accountsState({ accounts: mockAccounts }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.account-card').length).toBe(2);
  });

  it('should display IBAN on each card', () => {
    store.setState(accountsState({ accounts: [mockAccounts[0]] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('EE123456789012345678');
  });

  it('should format balance to 2 decimal places (5.4 → 5.40)', () => {
    store.setState(accountsState({ accounts: [{ ...mockAccounts[0], balance: 5.4 }] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.balance').textContent).toContain('5.40');
  });

  it('should format zero balance as 0.00', () => {
    store.setState(accountsState({ accounts: [{ ...mockAccounts[1], balance: 0 }] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.balance').textContent).toContain('0.00');
  });

  it('should show plural account count', () => {
    store.setState(accountsState({ accounts: mockAccounts }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.account-count').textContent).toContain('2 accounts');
  });

  it('should use singular "account" when count is 1', () => {
    store.setState(accountsState({ accounts: [mockAccounts[0]] }));
    fixture.detectChanges();
    const text: string = fixture.nativeElement.querySelector('.account-count').textContent;
    expect(text).toContain('1 account');
    expect(text).not.toContain('1 accounts');
  });

  it('should route each card to /accounts/:id', () => {
    store.setState(accountsState({ accounts: [mockAccounts[0]] }));
    fixture.detectChanges();
    const card: HTMLAnchorElement = fixture.nativeElement.querySelector('.account-card');
    expect(card.getAttribute('href')).toBe('/accounts/1');
  });

  it('should display currency badge on each card', () => {
    store.setState(accountsState({ accounts: [mockAccounts[0]] }));
    fixture.detectChanges();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.currency-badge');
    expect(badge.textContent?.trim()).toBe('EUR');
    expect(badge.getAttribute('data-currency')).toBe('EUR');
  });
});
