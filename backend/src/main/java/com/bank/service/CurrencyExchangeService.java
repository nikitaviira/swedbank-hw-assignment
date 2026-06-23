package com.bank.service;

import com.bank.enums.Currency;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
public class CurrencyExchangeService {

    private static final Map<Currency, BigDecimal> EUR_RATES = Map.of(
        Currency.EUR, new BigDecimal("1.0000"),
        Currency.USD, new BigDecimal("0.9260"),
        Currency.SEK, new BigDecimal("0.0876"),
        Currency.GBP, new BigDecimal("1.1630"),
        Currency.VND, new BigDecimal("0.0000370")
    );

    public BigDecimal convert(BigDecimal amount, Currency from, Currency to) {
        BigDecimal fromRate = EUR_RATES.get(from);
        BigDecimal toRate = EUR_RATES.get(to);
        return amount.multiply(fromRate).divide(toRate, 2, RoundingMode.HALF_UP);
    }
}
