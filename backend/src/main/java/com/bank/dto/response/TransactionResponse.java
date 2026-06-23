package com.bank.dto.response;

import com.bank.entity.Transaction;
import com.bank.enums.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionResponse(Long id, Long accountId, BigDecimal amount, TransactionType type,
                                   String description, BigDecimal balanceAfter, LocalDateTime createdAt) {
    public static TransactionResponse from(Transaction transaction) {
        return new TransactionResponse(
            transaction.getId(),
            transaction.getAccount().getId(),
            transaction.getAmount(),
            transaction.getType(),
            transaction.getDescription(),
            transaction.getBalanceAfter(),
            transaction.getCreatedAt()
        );
    }
}
