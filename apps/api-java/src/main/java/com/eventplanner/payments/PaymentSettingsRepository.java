package com.eventplanner.payments;

import com.eventplanner.events.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PaymentSettingsRepository extends JpaRepository<PaymentSettings, Long> {
    Optional<PaymentSettings> findByEvent(Event event);
}
