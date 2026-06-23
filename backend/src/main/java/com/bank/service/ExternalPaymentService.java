package com.bank.service;

import com.bank.exception.ExternalServiceException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class ExternalPaymentService {

    private final RestClient restClient;

    public ExternalPaymentService(RestClient restClient) {
        this.restClient = restClient;
    }

    public void authorizeDebit() {
        try {
            restClient.get()
                .uri("https://api.github.com")
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientException e) {
            throw new ExternalServiceException("External payment authorization failed: " + e.getMessage());
        }
    }
}
