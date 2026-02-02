package com.eventplanner.registration.promocodes;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PromoCodeRepository extends JpaRepository<PromoCode, Long> {
    List<PromoCode> findByEventIdAndIsActiveTrueOrderByCreatedAtDesc(Long eventId);
    Optional<PromoCode> findByCodeAndIsActiveTrue(String code);
    Optional<PromoCode> findByIdAndEventId(Long id, Long eventId);
}
