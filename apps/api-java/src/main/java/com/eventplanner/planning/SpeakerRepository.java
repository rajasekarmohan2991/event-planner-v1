package com.eventplanner.planning;

import com.eventplanner.events.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpeakerRepository extends JpaRepository<Speaker, Long> {
    List<Speaker> findByEvent(Event event);
    Page<Speaker> findByEvent(Event event, Pageable pageable);
}
