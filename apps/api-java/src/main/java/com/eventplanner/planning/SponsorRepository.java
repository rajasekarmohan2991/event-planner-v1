package com.eventplanner.planning;

import com.eventplanner.events.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SponsorRepository extends JpaRepository<Sponsor, Long> {
    List<Sponsor> findByEvent(Event event);
    Page<Sponsor> findByEvent(Event event, Pageable pageable);
}
