package com.eventplanner.planning;

import com.eventplanner.events.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findByEvent(Event event);
    List<Session> findByEventAndStartTimeBetween(Event event, OffsetDateTime start, OffsetDateTime end);
    Page<Session> findByEvent(Event event, Pageable pageable);
    Page<Session> findByEventAndStartTimeBetween(Event event, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
}
