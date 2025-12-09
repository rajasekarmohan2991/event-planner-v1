package com.eventplanner.planning;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EventPlanningRepository extends JpaRepository<EventPlanning, Long> {
    Optional<EventPlanning> findByEvent_Id(Long eventId);
}
