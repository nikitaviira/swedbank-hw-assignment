package com.bank.controller;

import com.bank.dto.response.TransactionResponse;
import com.bank.service.AccountService;
import com.bank.service.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final AccountService accountService;
    private final PdfService pdfService;

    public TransactionController(AccountService accountService, PdfService pdfService) {
        this.accountService = accountService;
        this.pdfService = pdfService;
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long id) {
        TransactionResponse tx = accountService.getTransactionById(id);
        byte[] pdf = pdfService.generateTransactionPdf(tx);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transaction-" + id + ".pdf\"")
            .body(pdf);
    }
}
