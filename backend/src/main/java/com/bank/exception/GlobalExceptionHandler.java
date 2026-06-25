package com.bank.exception;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception exception,
            Object body,
            HttpHeaders headers,
            HttpStatusCode statusCode,
            WebRequest webRequest
    ) {
        logError(statusCode.value(), exception);
        return new ResponseEntity<>(body, headers, statusCode);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        List<ValidationDetails> validationDetails = ex.getAllErrors().stream()
                .map(error -> {
                    if (error instanceof FieldError fieldError) {
                        return new ValidationDetails(
                                "Validation error",
                                fieldError.getField() + " " + error.getDefaultMessage()
                        );
                    }
                    return new ValidationDetails("Validation error", error.getDefaultMessage());
                })
                .toList();
        return handleExceptionInternal(ex, validationDetails, headers, HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Object> handleNotFound(NotFoundException ex, WebRequest request) {
        CustomErrorDetails payload = new CustomErrorDetails(
                LocalDateTime.now(),
                ex.getMessage(),
                request.getDescription(false)
        );

        return handleExceptionInternal(ex, payload, new HttpHeaders(), HttpStatus.NOT_FOUND, request);
    }

    @ExceptionHandler(InvalidOperationException.class)
    public ResponseEntity<Object> handleInvalidOperation(InvalidOperationException ex, WebRequest request) {
        CustomErrorDetails payload = new CustomErrorDetails(
                LocalDateTime.now(),
                ex.getMessage(),
                request.getDescription(false)
        );

        return handleExceptionInternal(ex, payload, new HttpHeaders(), HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<Object> handleExternalService(ExternalServiceException ex, WebRequest request) {
        CustomErrorDetails payload = new CustomErrorDetails(
                LocalDateTime.now(),
                ex.getMessage(),
                request.getDescription(false)
        );

        return handleExceptionInternal(ex, payload, new HttpHeaders(), HttpStatus.BAD_GATEWAY, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> fallbackExceptionHandler(Exception ex, WebRequest request) {
        CustomErrorDetails payload = new CustomErrorDetails(
                LocalDateTime.now(),
                "Internal server error",
                request.getDescription(false)
        );

        return handleExceptionInternal(ex, payload, new HttpHeaders(), HttpStatus.INTERNAL_SERVER_ERROR, request);
    }

    private static void logError(long status, Throwable e) {
        String msg = ExceptionUtils.getMessage(e);
        if (status >= 500) {
            logger.error("Exception handled: {}", msg, e);
        } else {
            logger.warn("Exception handled: {}", msg, e);
        }
    }

    public record CustomErrorDetails(
            LocalDateTime timestamp,
            String message,
            String description
    ) {
    }

    public record ValidationDetails(
            String message,
            String description
    ) {
    }
}
