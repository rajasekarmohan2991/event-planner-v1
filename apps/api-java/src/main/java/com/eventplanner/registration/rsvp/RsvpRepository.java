package com.eventplanner.registration.rsvp;

import com.eventplanner.events.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RsvpRepository extends JpaRepository<Rsvp, Long> {
    List<Rsvp> findByEvent(Event event);
}
