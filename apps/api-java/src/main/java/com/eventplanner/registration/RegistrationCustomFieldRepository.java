package com.eventplanner.registration;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegistrationCustomFieldRepository extends JpaRepository<RegistrationCustomField, Long> {
    List<RegistrationCustomField> findByEventIdOrderByOrderIndexAsc(Long eventId);
    Optional<RegistrationCustomField> findByIdAndEventId(Long id, Long eventId);
}
