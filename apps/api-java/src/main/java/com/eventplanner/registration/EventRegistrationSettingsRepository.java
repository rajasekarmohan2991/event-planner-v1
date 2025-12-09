package com.eventplanner.registration;

import com.eventplanner.events.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventRegistrationSettingsRepository extends JpaRepository<EventRegistrationSettings, Long> {
    Optional<EventRegistrationSettings> findByEvent(Event event);
    Optional<EventRegistrationSettings> findByEventId(Long eventId);
}
