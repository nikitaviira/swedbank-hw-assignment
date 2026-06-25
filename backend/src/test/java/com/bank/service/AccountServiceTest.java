package com.bank.service;

import com.bank.dto.request.CreateAccountRequest;
import com.bank.dto.request.CurrencyExchangeRequest;
import com.bank.dto.request.MoneyOperationRequest;
import com.bank.entity.Account;
import com.bank.enums.Currency;
import com.bank.dto.response.TransactionResponse;
import com.bank.entity.Transaction;
import com.bank.enums.TransactionType;
import com.bank.exception.AccountNotFoundException;
import com.bank.exception.DuplicateAccountException;
import com.bank.exception.ExternalServiceException;
import com.bank.exception.InsufficientFundsException;
import com.bank.exception.InvalidOperationException;
import com.bank.exception.TransactionNotFoundException;
import com.bank.util.IbanGenerator;
import com.bank.repository.AccountRepository;
import com.bank.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private ExternalPaymentService externalPaymentService;

    @Mock
    private CurrencyExchangeService currencyExchangeService;

    @InjectMocks
    private AccountService accountService;

    private static final String TEST_IBAN = IbanGenerator.generate();

    @Test
    void createAccount_savesWithZeroBalance() {
        when(accountRepository.findFirstByCurrency(Currency.EUR)).thenReturn(Optional.empty());
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        accountService.createAccount(new CreateAccountRequest("EUR"));

        ArgumentCaptor<Account> captor = ArgumentCaptor.forClass(Account.class);
        verify(accountRepository).save(captor.capture());
        assertThat(captor.getValue().getCurrency()).isEqualTo(Currency.EUR);
        assertThat(captor.getValue().getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void createAccount_duplicateCurrency_throwsException() {
        when(accountRepository.findFirstByCurrency(Currency.EUR))
            .thenReturn(Optional.of(new Account(Currency.EUR, TEST_IBAN)));

        assertThatThrownBy(() -> accountService.createAccount(new CreateAccountRequest("EUR")))
            .isInstanceOf(DuplicateAccountException.class)
            .hasMessageContaining("EUR");
    }

    @Test
    void credit_happyPath() {
        Account account = new Account(Currency.EUR, TEST_IBAN);
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        accountService.credit(1L, new MoneyOperationRequest(new BigDecimal("100")));

        ArgumentCaptor<Account> captor = ArgumentCaptor.forClass(Account.class);
        verify(accountRepository).save(captor.capture());
        assertThat(captor.getValue().getBalance()).isEqualByComparingTo(new BigDecimal("100"));
        verify(transactionRepository).save(any());
    }

    @Test
    void debit_happyPath() {
        Account account = new Account(Currency.EUR, TEST_IBAN);
        account.setBalance(new BigDecimal("200"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        accountService.debit(1L, new MoneyOperationRequest(new BigDecimal("50")));

        ArgumentCaptor<Account> captor = ArgumentCaptor.forClass(Account.class);
        verify(accountRepository).save(captor.capture());
        assertThat(captor.getValue().getBalance()).isEqualByComparingTo(new BigDecimal("150"));
        verify(transactionRepository).save(any());
    }

    @Test
    void debit_insufficientFunds_throwsException() {
        Account account = new Account(Currency.EUR, TEST_IBAN);
        account.setBalance(new BigDecimal("10"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> accountService.debit(1L, new MoneyOperationRequest(new BigDecimal("100"))))
            .isInstanceOf(InsufficientFundsException.class);
        verify(accountRepository, never()).save(any());
    }

    @Test
    void debit_externalServiceFailure_throwsException() {
        Account account = new Account(Currency.EUR, TEST_IBAN);
        account.setBalance(new BigDecimal("200"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        doThrow(new ExternalServiceException("External error")).when(externalPaymentService).authorizeDebit();

        assertThatThrownBy(() -> accountService.debit(1L, new MoneyOperationRequest(new BigDecimal("50"))))
            .isInstanceOf(ExternalServiceException.class);
        verify(accountRepository, never()).save(any());
    }

    @Test
    void getAccountById_notFound_throwsException() {
        when(accountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.getAccountById(99L))
            .isInstanceOf(AccountNotFoundException.class);
    }

    @Test
    void exchange_happyPath_debitsSourceAndCreditsTarget() {
        Account source = new Account(Currency.EUR, TEST_IBAN);
        source.setBalance(new BigDecimal("200"));
        Account target = new Account(Currency.USD, TEST_IBAN);

        when(accountRepository.findById(1L)).thenReturn(Optional.of(source));
        when(currencyExchangeService.convert(any(), eq(Currency.EUR), eq(Currency.USD)))
            .thenReturn(new BigDecimal("108.00"));
        when(accountRepository.findFirstByCurrency(Currency.USD)).thenReturn(Optional.of(target));
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        accountService.exchange(1L, new CurrencyExchangeRequest("USD", new BigDecimal("100")));

        assertThat(source.getBalance()).isEqualByComparingTo(new BigDecimal("100"));
        assertThat(target.getBalance()).isEqualByComparingTo(new BigDecimal("108.00"));
        verify(transactionRepository, times(2)).save(any());
    }

    @Test
    void exchange_createsTargetAccount_whenNotExists() {
        Account source = new Account(Currency.EUR, TEST_IBAN);
        source.setBalance(new BigDecimal("100"));

        when(accountRepository.findById(1L)).thenReturn(Optional.of(source));
        when(currencyExchangeService.convert(any(), any(), any())).thenReturn(new BigDecimal("50"));
        when(accountRepository.findFirstByCurrency(Currency.USD)).thenReturn(Optional.empty());
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        accountService.exchange(1L, new CurrencyExchangeRequest("USD", new BigDecimal("50")));

        ArgumentCaptor<Account> captor = ArgumentCaptor.forClass(Account.class);
        verify(accountRepository, atLeast(2)).save(captor.capture());
        assertThat(captor.getAllValues()).anyMatch(a -> a.getCurrency() == Currency.USD);
    }

    @Test
    void exchange_sameCurrency_throwsInvalidOperation() {
        Account source = new Account(Currency.EUR, TEST_IBAN);
        when(accountRepository.findById(1L)).thenReturn(Optional.of(source));

        assertThatThrownBy(() -> accountService.exchange(1L,
                new CurrencyExchangeRequest("EUR", new BigDecimal("50"))))
            .isInstanceOf(InvalidOperationException.class)
            .hasMessageContaining("same currency");
    }

    @Test
    void exchange_insufficientFunds_throws() {
        Account source = new Account(Currency.EUR, TEST_IBAN);
        source.setBalance(new BigDecimal("10"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(source));

        assertThatThrownBy(() -> accountService.exchange(1L,
                new CurrencyExchangeRequest("USD", new BigDecimal("100"))))
            .isInstanceOf(InsufficientFundsException.class);
        verify(accountRepository, never()).save(any());
    }

    @Test
    void exchange_sourceNotFound_throws() {
        when(accountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.exchange(99L,
                new CurrencyExchangeRequest("USD", new BigDecimal("50"))))
            .isInstanceOf(AccountNotFoundException.class);
    }

    @Test
    void getTransactionById_found_returnsResponse() {
        Account account = new Account(Currency.EUR, TEST_IBAN);
        Transaction tx = new Transaction(account, new BigDecimal("50"), TransactionType.CREDIT, "deposit", new BigDecimal("150"));
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(tx));

        TransactionResponse response = accountService.getTransactionById(1L);

        assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("50"));
        assertThat(response.type()).isEqualTo(TransactionType.CREDIT);
        assertThat(response.description()).isEqualTo("deposit");
        assertThat(response.balanceAfter()).isEqualByComparingTo(new BigDecimal("150"));
        assertThat(response.currency()).isEqualTo("EUR");
    }

    @Test
    void getTransactionById_notFound_throwsException() {
        when(transactionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.getTransactionById(99L))
            .isInstanceOf(TransactionNotFoundException.class)
            .hasMessageContaining("99");
    }
}
