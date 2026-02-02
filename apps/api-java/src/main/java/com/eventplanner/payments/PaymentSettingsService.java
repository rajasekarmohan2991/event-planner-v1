package com.eventplanner.payments;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
public class PaymentSettingsService {
    private final PaymentSettingsRepository repo;
    private final EventRepository events;

    public PaymentSettingsService(PaymentSettingsRepository repo, EventRepository events) {
        this.repo = repo;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public PaymentSettings get(Long eventId) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        return repo.findByEvent(e).orElseGet(() -> repo.save(PaymentSettings.builder().event(e).build()));
    }

    @Transactional
    public PaymentSettings update(Long eventId, PaymentSettings input) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        PaymentSettings ps = repo.findByEvent(e).orElseGet(() -> PaymentSettings.builder().event(e).build());
        if (input.getTaxRatePercent() != null) {
            int v = Math.max(0, Math.min(100, input.getTaxRatePercent()));
            if (v == 0 || v == 12 || v == 18 || v == 28) {
                ps.setTaxRatePercent(v);
            } else {
                ps.setTaxRatePercent(18);
            }
        }
        return repo.save(ps);
    }
}
