package com.bank.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.Arrays;
import java.util.List;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    private static final String PREFIX_IN = "IN";

    private static final String PREFIX_OUT = "OUT";

    private static final int MAX_BODY_LENGTH = 4000;

    private static final List<MediaType> VISIBLE_TYPES = Arrays.asList(
            MediaType.APPLICATION_JSON,
            MediaType.valueOf("application/*+json")
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (isAsyncDispatch(request)) {
            filterChain.doFilter(request, response);
        } else {
            doFilterWrapped(wrapRequest(request), wrapResponse(response), filterChain);
        }
    }

    private ContentCachingRequestWrapper wrapRequest(HttpServletRequest request) {
        if (request instanceof ContentCachingRequestWrapper wrapper) {
            return wrapper;
        } else {
            return new ContentCachingRequestWrapper(request, MAX_BODY_LENGTH);
        }
    }

    private ContentCachingResponseWrapper wrapResponse(HttpServletResponse response) {
        if (response instanceof ContentCachingResponseWrapper wrapper) {
            return wrapper;
        } else {
            return new ContentCachingResponseWrapper(response);
        }
    }

    private void doFilterWrapped(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response, FilterChain filterChain)
            throws ServletException, IOException {
        long startNanos = System.nanoTime();
        try {
            logRequestHeader(request);
            filterChain.doFilter(request, response);
        } finally {
            logRequestBody(request);
            logResponse(response, startNanos);
            response.copyBodyToResponse();
        }
    }

    private void logRequestHeader(ContentCachingRequestWrapper request) {
        String queryString = request.getQueryString();
        String remoteAddr = request.getRemoteAddr();
        String contentType = request.getContentType() != null ? request.getContentType() : "";
        if (queryString == null) {
            logger.info("{} [{}] [{}] [{}] [{}]",
                    RequestLoggingFilter.PREFIX_IN, remoteAddr, request.getMethod(), contentType, request.getRequestURI());
        } else {
            logger.info("{} [{}] [{}] [{}] [{}?{}]",
                    RequestLoggingFilter.PREFIX_IN, remoteAddr, request.getMethod(), contentType, request.getRequestURI(), queryString);
        }
    }

    private void logRequestBody(ContentCachingRequestWrapper request) {
        byte[] content = request.getContentAsByteArray();
        if (content.length > 0) {
            logContent(content, request.getContentType(), request.getCharacterEncoding(), RequestLoggingFilter.PREFIX_IN);
        }
    }

    private void logResponse(ContentCachingResponseWrapper response, long startNanos) {
        int status = response.getStatus();
        HttpStatus httpStatus = HttpStatus.valueOf(status);

        String elapsed = String.format("%.3f", (System.nanoTime() - startNanos) / 1_000_000_000.0);
        logger.info("{} [{}] [{}] [{}s]", RequestLoggingFilter.PREFIX_OUT, status, httpStatus.getReasonPhrase(), elapsed);
        byte[] content = response.getContentAsByteArray();
        if (content.length > 0) {
            logContent(content, response.getContentType(), response.getCharacterEncoding(), RequestLoggingFilter.PREFIX_OUT);
        }
    }

    private void logContent(byte[] content, String contentType, String contentEncoding, String prefix) {
        MediaType mediaType = MediaType.valueOf(contentType);
        boolean visible = VISIBLE_TYPES.stream().anyMatch(visibleType -> visibleType.includes(mediaType));
        if (visible) {
            try {
                String stringContent = replaceNewLineSymbols(new String(content, contentEncoding));
                logger.info("{} [{}]", prefix, stringContent);
            } catch (UnsupportedEncodingException e) {
                logger.info("{} [content N/A]", prefix);
            }
        } else {
            logger.info("{} [content N/A]", prefix);
        }
    }

    private String replaceNewLineSymbols(String s) {
        return s.replaceAll("\\R", "");
    }
}