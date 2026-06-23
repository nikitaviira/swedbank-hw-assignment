package com.bank.util;

import org.iban4j.CountryCode;
import org.iban4j.Iban;

public class IbanGenerator {

    private IbanGenerator() {}

    public static String generate() {
        return Iban.random(CountryCode.EE).toString();
    }
}
