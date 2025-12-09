package com.eventplanner.microsite;

import com.eventplanner.events.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MicrositeSectionRepository extends JpaRepository<MicrositeSection, Long> {
    List<MicrositeSection> findByEventOrderByPositionAsc(Event event);
    Page<MicrositeSection> findByEvent(Event event, Pageable pageable);
}
