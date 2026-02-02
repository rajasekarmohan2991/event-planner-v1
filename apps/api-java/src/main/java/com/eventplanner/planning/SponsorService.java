package com.eventplanner.planning;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@Transactional
public class SponsorService {
    private final SponsorRepository sponsorRepository;
    private final EventRepository eventRepository;

    public SponsorService(SponsorRepository sponsorRepository, EventRepository eventRepository) {
        this.sponsorRepository = sponsorRepository;
        this.eventRepository = eventRepository;
    }

    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + eventId));
    }

    public List<Sponsor> list(Long eventId) {
        return sponsorRepository.findByEvent(getEventOrThrow(eventId));
    }

    public Page<Sponsor> list(Long eventId, Pageable pageable) {
        return sponsorRepository.findByEvent(getEventOrThrow(eventId), pageable);
    }

    public Sponsor create(Long eventId, Sponsor payload) {
        Event event = getEventOrThrow(eventId);
        payload.setEvent(event);
        return sponsorRepository.save(payload);
    }

    public Sponsor update(Long eventId, Long id, Sponsor payload) {
        Sponsor existing = sponsorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sponsor not found: " + id));
        if (!existing.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Sponsor does not belong to event");
        }
        existing.setName(payload.getName());
        existing.setTier(payload.getTier());
        existing.setLogoUrl(payload.getLogoUrl());
        existing.setWebsite(payload.getWebsite());
        return sponsorRepository.save(existing);
    }

    public void delete(Long eventId, Long id) {
        Sponsor existing = sponsorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sponsor not found: " + id));
        if (!existing.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Sponsor does not belong to event");
        }
        sponsorRepository.delete(existing);
    }
}
