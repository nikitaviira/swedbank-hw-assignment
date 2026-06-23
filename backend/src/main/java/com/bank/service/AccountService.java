package com.bank.service;

import com.bank.dto.request.CreateAccountRequest;
import com.bank.dto.request.CurrencyExchangeRequest;
import com.bank.dto.request.MoneyOperationRequest;
import com.bank.dto.response.AccountResponse;
import com.bank.dto.response.TransactionResponse;
import com.bank.entity.Account;
import com.bank.entity.Transaction;
import com.bank.enums.Currency;
import com.bank.enums.TransactionType;
import com.bank.exception.AccountNotFoundException;
import com.bank.exception.DuplicateAccountException;
import com.bank.exception.InsufficientFundsException;
import com.bank.exception.InvalidOperationException;
import com.bank.util.IbanGenerator;
import com.bank.repository.AccountRepository;
import com.bank.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final ExternalPaymentService externalPaymentService;
    private final CurrencyExchangeService currencyExchangeService;

    public AccountService(AccountRepository accountRepository,
                          TransactionRepository transactionRepository,
                          ExternalPaymentService externalPaymentService,
                          CurrencyExchangeService currencyExchangeService) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.externalPaymentService = externalPaymentService;
        this.currencyExchangeService = currencyExchangeService;
    }

    @Transactional
    public void createAccount(CreateAccountRequest request) {
        Currency currency = Currency.valueOf(request.currency().toUpperCase());
        if (accountRepository.findFirstByCurrency(currency).isPresent()) {
            throw new DuplicateAccountException(currency);
        }

        accountRepository.save(new Account(currency, IbanGenerator.generate()));
    }

    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll().stream().map(AccountResponse::from).toList();
    }

    public AccountResponse getAccountById(Long id) {
        return accountRepository.findById(id)
            .map(AccountResponse::from)
            .orElseThrow(() -> new AccountNotFoundException(id));
    }

    @Transactional
    public void credit(Long accountId, MoneyOperationRequest request) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new AccountNotFoundException(accountId));

        account.setBalance(account.getBalance().add(request.amount()));
        accountRepository.save(account);
        transactionRepository.save(new Transaction(account, request.amount(), TransactionType.CREDIT, "Credit", account.getBalance()));
    }

    @Transactional
    public void debit(Long accountId, MoneyOperationRequest request) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new AccountNotFoundException(accountId));

        if (account.getBalance().compareTo(request.amount()) < 0) {
            throw new InsufficientFundsException(account.getBalance(), request.amount());
        }

        externalPaymentService.authorizeDebit();

        account.setBalance(account.getBalance().subtract(request.amount()));
        accountRepository.save(account);
        transactionRepository.save(new Transaction(account, request.amount(), TransactionType.DEBIT, "Debit", account.getBalance()));
    }

    @Transactional
    public void exchange(Long sourceAccountId, CurrencyExchangeRequest request) {
        Currency targetCurrency = Currency.valueOf(request.targetCurrency().toUpperCase());

        Account sourceAcc = accountRepository.findById(sourceAccountId)
            .orElseThrow(() -> new AccountNotFoundException(sourceAccountId));

        if (sourceAcc.getCurrency().equals(targetCurrency)) {
            throw new InvalidOperationException("Cannot exchange to the same currency: " + targetCurrency);
        }

        if (sourceAcc.getBalance().compareTo(request.amount()) < 0) {
            throw new InsufficientFundsException(sourceAcc.getBalance(), request.amount());
        }

        BigDecimal convertedAmount = currencyExchangeService.convert(
            request.amount(), sourceAcc.getCurrency(), targetCurrency);

        Account targetAcc = accountRepository.findFirstByCurrency(targetCurrency)
            .orElseGet(() -> accountRepository.save(new Account(targetCurrency, IbanGenerator.generate())));

        externalPaymentService.authorizeDebit();

        sourceAcc.setBalance(sourceAcc.getBalance().subtract(request.amount()));
        accountRepository.save(sourceAcc);

        String description = "Exchange %s -> %s".formatted(sourceAcc.getCurrency(), targetCurrency);
        transactionRepository.save(new Transaction(sourceAcc, request.amount(), TransactionType.DEBIT, description, sourceAcc.getBalance()));

        targetAcc.setBalance(targetAcc.getBalance().add(convertedAmount));
        accountRepository.save(targetAcc);
        transactionRepository.save(new Transaction(targetAcc, convertedAmount, TransactionType.CREDIT, description, targetAcc.getBalance()));
    }

    public Page<TransactionResponse> getTransactions(Long accountId, Pageable pageable) {
        if (!accountRepository.existsById(accountId)) {
            throw new AccountNotFoundException(accountId);
        }

        return transactionRepository.findByAccountId(accountId, pageable).map(TransactionResponse::from);
    }
}
