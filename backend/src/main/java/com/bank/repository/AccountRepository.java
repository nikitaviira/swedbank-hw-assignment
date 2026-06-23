package com.bank.repository;

import com.bank.entity.Account;
import com.bank.enums.Currency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findFirstByCurrency(Currency currency);
}
