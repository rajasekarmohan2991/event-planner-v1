package com.eventplanner.registration;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    long countByEventId(Long eventId);
    List<Registration> findByEventId(Long eventId);
    List<Registration> findByEventIdAndType(Long eventId, RegistrationType type);
}
