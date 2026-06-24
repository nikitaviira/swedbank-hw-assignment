package com.bank.controller;

import com.bank.dto.response.TransactionResponse;
import com.bank.enums.TransactionType;
import com.bank.exception.AccountNotFoundException;
import com.bank.exception.GlobalExceptionHandler;
import com.bank.service.AccountService;
import com.bank.service.PdfService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock
    private AccountService accountService;

    @Mock
    private PdfService pdfService;

    private MockMvc mockMvc;

    private final TransactionResponse sampleTx = new TransactionResponse(
        1L, 1L, new BigDecimal("150.00"), TransactionType.CREDIT,
        "Salary", new BigDecimal("1150.00"), LocalDateTime.of(2024, 1, 1, 1, 1), "EUR"
    );

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(new TransactionController(accountService, pdfService))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @Test
    void exportPdf_existingId_returns200WithPdfContentType() throws Exception {
        byte[] fakePdf = "fake content".getBytes();
        when(accountService.getTransactionById(1L)).thenReturn(sampleTx);
        when(pdfService.generateTransactionPdf(sampleTx)).thenReturn(fakePdf);

        mockMvc.perform(get("/api/transactions/1/pdf"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_PDF))
            .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transaction-1.pdf\""))
            .andExpect(content().bytes(fakePdf));
    }

    @Test
    void exportPdf_notFoundId_returns404() throws Exception {
        when(accountService.getTransactionById(99L)).thenThrow(new AccountNotFoundException(99L));

        mockMvc.perform(get("/api/transactions/99/pdf"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Account not found: 99"));
    }
}
