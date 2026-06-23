package com.bank.integration;

import com.bank.service.ExternalPaymentService;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AccountIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @MockitoBean
    private ExternalPaymentService externalPaymentService;

    @Autowired
    private WebApplicationContext wac;

    private MockMvc mockMvc;

    private static Long accountId;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac).build();
    }

    @Test
    @Order(1)
    void createAccount_persistsAndReturns201() throws Exception {
        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currency\":\"EUR\"}"))
            .andExpect(status().isOk());

        String json = mockMvc.perform(get("/api/accounts"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        List<Integer> ids = JsonPath.read(json, "$[*].id");
        assertThat(ids).hasSize(1);
        accountId = ids.getFirst().longValue();

        String iban = JsonPath.read(json, "$[0].iban");
        assertThat(iban).matches("EE\\d{18}");

        Number balance = JsonPath.read(json, "$[0].balance");
        assertThat(new BigDecimal(balance.toString())).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @Order(2)
    void createAccount_duplicateCurrency_returns400() throws Exception {
        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currency\":\"EUR\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Account with currency EUR already exists"));
    }

    @Test
    @Order(3)
    void creditAccount_updatesBalance() throws Exception {
        mockMvc.perform(post("/api/accounts/" + accountId + "/credit")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":100}"))
            .andExpect(status().isOk());

        String json = mockMvc.perform(get("/api/accounts/" + accountId))
            .andReturn().getResponse().getContentAsString();
        Number balance = JsonPath.read(json, "$.balance");
        assertThat(new BigDecimal(balance.toString())).isEqualByComparingTo(new BigDecimal("100"));
    }

    @Test
    @Order(4)
    void debitAccount_updatesBalance() throws Exception {
        mockMvc.perform(post("/api/accounts/" + accountId + "/debit")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":40}"))
            .andExpect(status().isOk());

        String json = mockMvc.perform(get("/api/accounts/" + accountId))
            .andReturn().getResponse().getContentAsString();
        Number balance = JsonPath.read(json, "$.balance");
        assertThat(new BigDecimal(balance.toString())).isEqualByComparingTo(new BigDecimal("60"));
    }

    @Test
    @Order(5)
    void debitAccount_insufficientFunds_returns400() throws Exception {
        mockMvc.perform(post("/api/accounts/" + accountId + "/debit")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":1000}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(containsString("Insufficient funds")));
    }

    @Test
    @Order(6)
    void getTransactions_returnsTwoRecords() throws Exception {
        String json = mockMvc.perform(get("/api/accounts/" + accountId + "/transactions"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        List<?> content = JsonPath.read(json, "$.content");
        assertThat(content).hasSize(2);
    }

    @Test
    @Order(7)
    void exchangeAccount_createsTargetAndUpdatesBalances() throws Exception {
        mockMvc.perform(post("/api/accounts/" + accountId + "/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetCurrency\":\"USD\",\"amount\":10}"))
            .andExpect(status().isOk());

        String json = mockMvc.perform(get("/api/accounts/" + accountId))
            .andReturn().getResponse().getContentAsString();
        Number sourceBalance = JsonPath.read(json, "$.balance");
        assertThat(new BigDecimal(sourceBalance.toString())).isEqualByComparingTo(new BigDecimal("50"));

        String allJson = mockMvc.perform(get("/api/accounts"))
            .andReturn().getResponse().getContentAsString();
        List<String> currencies = JsonPath.read(allJson, "$[*].currency");
        assertThat(currencies).contains("USD");
        List<Number> balances = JsonPath.read(allJson, "$[?(@.currency=='USD')].balance");
        assertThat(new BigDecimal(balances.getFirst().toString())).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    @Order(8)
    void exchangeAccount_sameCurrency_returns400() throws Exception {
        mockMvc.perform(post("/api/accounts/" + accountId + "/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetCurrency\":\"EUR\",\"amount\":10}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(containsString("same currency")));
    }

    @Test
    @Order(9)
    void getAllAccounts_returnsCreatedAccount() throws Exception {
        String json = mockMvc.perform(get("/api/accounts"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        List<Integer> ids = JsonPath.read(json, "$[*].id");
        assertThat(ids.stream().map(Number::longValue)).contains(accountId);
    }
}
