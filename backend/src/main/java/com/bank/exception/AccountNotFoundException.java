package com.bank.exception;

public class AccountNotFoundException extends NotFoundException {
    public AccountNotFoundException(Long id) {
        super("Account not found: " + id);
    }
}
