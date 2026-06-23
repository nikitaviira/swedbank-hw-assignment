package com.bank.dto.response;

import com.bank.entity.Account;
import com.bank.enums.Currency;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountResponse(Long id, String iban, Currency currency, BigDecimal balance, LocalDateTime createdAt) {
    public static AccountResponse from(Account account) {
        return new AccountResponse(account.getId(), account.getIban(), account.getCurrency(), account.getBalance(), account.getCreatedAt());
    }
}
