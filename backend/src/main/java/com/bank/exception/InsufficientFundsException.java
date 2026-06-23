package com.bank.exception;

import java.math.BigDecimal;

public class InsufficientFundsException extends InvalidOperationException {
    public InsufficientFundsException(BigDecimal balance, BigDecimal requested) {
        super("Insufficient funds: balance " + balance + ", requested " + requested);
    }
}
