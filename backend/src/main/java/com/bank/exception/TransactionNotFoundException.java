package com.bank.exception;

public class TransactionNotFoundException extends NotFoundException {
    public TransactionNotFoundException(Long id) {
        super("Transaction not found: " + id);
    }
}
