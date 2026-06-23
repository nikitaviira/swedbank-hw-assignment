package com.bank.dto.request;

import com.bank.validation.ValidCurrency;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CurrencyExchangeRequest(
    @NotNull @ValidCurrency String targetCurrency,
    @NotNull @Positive @Digits(integer = 15, fraction = 2) BigDecimal amount
) {}
