package com.bank.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    private static final String API_TITLE = "Bank_API";
    private static final String API_DESCRIPTION = "For testing purposes";

    private static final String API_GROUP_TITLE = "Accounts API";
    private static final String API_PATH = "/api/**";

    @Bean
    public OpenAPI apiConf() {
        return new OpenAPI()
            .info(new Info()
                .title(API_TITLE)
                .description(API_DESCRIPTION)
                .version("1.0.0"));
    }

    @Bean
    public GroupedOpenApi api() {
        return GroupedOpenApi.builder()
            .group(API_GROUP_TITLE)
            .pathsToMatch(API_PATH)
            .build();
    }
}