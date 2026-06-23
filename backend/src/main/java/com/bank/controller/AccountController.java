package com.bank.controller;

import com.bank.dto.request.CreateAccountRequest;
import com.bank.dto.request.CurrencyExchangeRequest;
import com.bank.dto.request.MoneyOperationRequest;
import com.bank.dto.response.AccountResponse;
import com.bank.dto.response.TransactionResponse;
import com.bank.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public void createAccount(@Valid @RequestBody CreateAccountRequest request) {
        accountService.createAccount(request);
    }

    @GetMapping
    public List<AccountResponse> getAllAccounts() {
        return accountService.getAllAccounts();
    }

    @GetMapping("/{id}")
    public AccountResponse getAccount(@PathVariable Long id) {
        return accountService.getAccountById(id);
    }

    @PostMapping("/{id}/credit")
    public void credit(@PathVariable Long id, @Valid @RequestBody MoneyOperationRequest request) {
        accountService.credit(id, request);
    }

    @PostMapping("/{id}/debit")
    public void debit(@PathVariable Long id, @Valid @RequestBody MoneyOperationRequest request) {
        accountService.debit(id, request);
    }

    @PostMapping("/{id}/exchange")
    public void exchange(@PathVariable Long id, @Valid @RequestBody CurrencyExchangeRequest request) {
        accountService.exchange(id, request);
    }

    @GetMapping("/{id}/transactions")
    public Page<TransactionResponse> getTransactions(
            @PathVariable Long id,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return accountService.getTransactions(id, pageable);
    }
}
