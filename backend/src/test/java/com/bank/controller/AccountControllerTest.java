package com.bank.controller;

import com.bank.dto.response.AccountResponse;
import com.bank.enums.Currency;
import com.bank.exception.AccountNotFoundException;
import com.bank.exception.DuplicateAccountException;
import com.bank.exception.ExternalServiceException;
import com.bank.exception.GlobalExceptionHandler;
import com.bank.exception.InsufficientFundsException;
import com.bank.exception.InvalidOperationException;
import com.bank.service.AccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AccountControllerTest {

    @Mock
    private AccountService accountService;

    private MockMvc mockMvc;

    private static final String TEST_IBAN = "EE471234567890123456";

    private final AccountResponse sampleAccount =
        new AccountResponse(1L, TEST_IBAN, Currency.EUR, new BigDecimal("100.00"), LocalDateTime.now());

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(new AccountController(accountService))
            .setControllerAdvice(new GlobalExceptionHandler())
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
            .build();
    }

    @Test
    void createAccount_validRequest_returns200() throws Exception {
        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currency\":\"EUR\"}"))
            .andExpect(status().isOk());
    }

    @Test
    void createAccount_duplicateCurrency_returns400() throws Exception {
        doThrow(new DuplicateAccountException(Currency.EUR)).when(accountService).createAccount(any());

        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currency\":\"EUR\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Account with currency EUR already exists"));
    }

    @Test
    void createAccount_missingCurrency_returns400() throws Exception {
        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$[0].description").value(containsString("currency")));
    }

    @Test
    void createAccount_invalidCurrency_returns400() throws Exception {
        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currency\":\"XYZ\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$[0].description").value(containsString("EUR, USD, SEK, GBP, VND")));
    }

    @Test
    void getAllAccounts_returns200() throws Exception {
        when(accountService.getAllAccounts()).thenReturn(List.of(sampleAccount));

        mockMvc.perform(get("/api/accounts"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].currency").value("EUR"));
    }

    @Test
    void getAccountById_returns200() throws Exception {
        when(accountService.getAccountById(1L)).thenReturn(sampleAccount);

        mockMvc.perform(get("/api/accounts/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getAccountById_notFound_returns404() throws Exception {
        when(accountService.getAccountById(99L)).thenThrow(new AccountNotFoundException(99L));

        mockMvc.perform(get("/api/accounts/99"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Account not found: 99"));
    }

    @Test
    void credit_validRequest_returns200() throws Exception {
        mockMvc.perform(post("/api/accounts/1/credit")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":100}"))
            .andExpect(status().isOk());
    }

    @Test
    void credit_negativeAmount_returns400() throws Exception {
        mockMvc.perform(post("/api/accounts/1/credit")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":-50}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$[0].description").value(containsString("amount")));
    }

    @Test
    void debit_validRequest_returns200() throws Exception {
        mockMvc.perform(post("/api/accounts/1/debit")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":50}"))
            .andExpect(status().isOk());
    }

    @Test
    void debit_insufficientFunds_returns400() throws Exception {
        doThrow(new InsufficientFundsException(new BigDecimal("10"), new BigDecimal("100")))
            .when(accountService).debit(eq(1L), any());

        mockMvc.perform(post("/api/accounts/1/debit")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":100}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Insufficient funds: balance 10, requested 100"));
    }

    @Test
    void debit_externalFailure_returns502() throws Exception {
        doThrow(new ExternalServiceException("External error")).when(accountService).debit(eq(1L), any());

        mockMvc.perform(post("/api/accounts/1/debit")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":50}"))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.message").value("External error"));
    }

    @Test
    void exchange_validRequest_returns200() throws Exception {
        mockMvc.perform(post("/api/accounts/1/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetCurrency\":\"USD\",\"amount\":100}"))
            .andExpect(status().isOk());
    }

    @Test
    void credit_tooManyDecimals_returns400() throws Exception {
        mockMvc.perform(post("/api/accounts/1/credit")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":100.123}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$[0].description").value(containsString("amount")));
    }

    @Test
    void debit_tooManyDecimals_returns400() throws Exception {
        mockMvc.perform(post("/api/accounts/1/debit")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":50.999}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$[0].description").value(containsString("amount")));
    }

    @Test
    void exchange_tooManyDecimals_returns400() throws Exception {
        mockMvc.perform(post("/api/accounts/1/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetCurrency\":\"USD\",\"amount\":100.123}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$[0].description").value(containsString("amount")));
    }

    @Test
    void exchange_invalidCurrency_returns400() throws Exception {
        mockMvc.perform(post("/api/accounts/1/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetCurrency\":\"XYZ\",\"amount\":100}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$[0].description").value(containsString("EUR, USD, SEK, GBP, VND")));
    }

    @Test
    void exchange_sameCurrency_returns400() throws Exception {
        doThrow(new InvalidOperationException("Cannot exchange to the same currency: EUR"))
            .when(accountService).exchange(eq(1L), any());

        mockMvc.perform(post("/api/accounts/1/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetCurrency\":\"EUR\",\"amount\":100}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(containsString("same currency")));
    }

    @Test
    void getTransactions_returns200() throws Exception {
        when(accountService.getTransactions(eq(1L), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        mockMvc.perform(get("/api/accounts/1/transactions"))
            .andExpect(status().isOk());
    }

    @Test
    void getTransactions_pageableParams_passedToService() throws Exception {
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(accountService.getTransactions(eq(1L), pageableCaptor.capture()))
            .thenReturn(new PageImpl<>(List.of(), PageRequest.of(2, 5), 0));

        mockMvc.perform(get("/api/accounts/1/transactions")
                .param("page", "2")
                .param("size", "5"))
            .andExpect(status().isOk());

        Pageable pageable = pageableCaptor.getValue();
        assertThat(pageable.getPageNumber()).isEqualTo(2);
        assertThat(pageable.getPageSize()).isEqualTo(5);
    }
}
