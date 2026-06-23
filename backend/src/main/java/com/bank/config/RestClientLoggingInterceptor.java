package com.bank.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

@Component
public class RestClientLoggingInterceptor implements ClientHttpRequestInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RestClientLoggingInterceptor.class);

    @Override
    public ClientHttpResponse intercept(HttpRequest req, byte[] reqBody, ClientHttpRequestExecution ex) throws IOException {
        logRequest(req, reqBody);
        ClientHttpResponse response = ex.execute(req, reqBody);
        logResponse(response);
        if (response.getBody().markSupported()) {
            response.getBody().reset();
        }
        return response;
    }

    private void logRequest(HttpRequest req, byte[] reqBody) {
        logger.info("###### Start Request ######");
        logger.info("Uri: {}", req.getURI());
        logger.info("Method: {}", req.getMethod());
        logger.info("Header: {}", req.getHeaders());
        logger.info("Body: {}", new String(reqBody, StandardCharsets.UTF_8));
        logger.info("###### End Request ######");
    }

    private void logResponse(ClientHttpResponse response) throws IOException {
        logger.info("###### Start Response ######");
        logger.info("Status: {}", response.getStatusCode());
        logger.info("Header: {}", response.getHeaders());
        logger.info("Body: {}", StreamUtils.copyToString(response.getBody(), Charset.defaultCharset()));
        logger.info("###### End Response ######");
    }
}