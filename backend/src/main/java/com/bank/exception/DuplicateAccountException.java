package com.bank.exception;

import com.bank.enums.Currency;

public class DuplicateAccountException extends InvalidOperationException {
    public DuplicateAccountException(Currency currency) {
        super("Account with currency " + currency + " already exists");
    }
}
