package com.bank.dto.request;

import com.bank.validation.ValidCurrency;
import jakarta.validation.constraints.NotNull;

public record CreateAccountRequest(@NotNull @ValidCurrency String currency) {}
