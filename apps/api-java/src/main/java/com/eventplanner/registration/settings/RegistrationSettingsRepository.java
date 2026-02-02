package com.eventplanner.registration.settings;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RegistrationSettingsRepository extends JpaRepository<RegistrationSettings, Long> {
    Optional<RegistrationSettings> findByEventId(Long eventId);
}
