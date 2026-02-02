package com.eventplanner.microsite;

import com.eventplanner.events.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MicrositeThemeRepository extends JpaRepository<MicrositeTheme, Long> {
    Optional<MicrositeTheme> findByEvent(Event event);
}
