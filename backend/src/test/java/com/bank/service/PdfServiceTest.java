package com.bank.service;

import com.bank.dto.response.TransactionResponse;
import com.bank.enums.TransactionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class PdfServiceTest {

    private PdfService pdfService;

    private final TransactionResponse sampleTx = new TransactionResponse(
        1L, 1L, new BigDecimal("150.75"), TransactionType.CREDIT,
        "Salary", new BigDecimal("1500.00"), LocalDateTime.of(2024, 3, 15, 9, 30), "EUR"
    );

    @BeforeEach
    void setup() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);

        pdfService = new PdfService(engine);
    }

    @Test
    void generateTransactionPdf_returnsNonEmptyBytes() {
        byte[] pdf = pdfService.generateTransactionPdf(sampleTx);

        assertThat(pdf).isNotEmpty();
    }

    @Test
    void generateTransactionPdf_returnsPdfMagicBytes() {
        byte[] pdf = pdfService.generateTransactionPdf(sampleTx);

        assertThat(new String(pdf, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    void generateTransactionPdf_worksForDebitTransaction() {
        TransactionResponse debitTx = new TransactionResponse(
            1L, 1L, new BigDecimal("50.00"), TransactionType.DEBIT,
            "Payment", new BigDecimal("950.00"), LocalDateTime.of(2024, 1, 1, 1, 1), "USD"
        );

        byte[] pdf = pdfService.generateTransactionPdf(debitTx);

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    void generateTransactionPdf_templateEngineFailure_throwsRuntimeException() {
        SpringTemplateEngine brokenEngine = mock(SpringTemplateEngine.class);
        when(brokenEngine.process(anyString(), any())).thenThrow(new RuntimeException("template error"));

        PdfService brokenService = new PdfService(brokenEngine);

        assertThatThrownBy(() -> brokenService.generateTransactionPdf(sampleTx))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("template error");
    }
}
