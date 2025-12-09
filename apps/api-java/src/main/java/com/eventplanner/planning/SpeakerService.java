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
public class SpeakerService {
    private final SpeakerRepository speakerRepository;
    private final EventRepository eventRepository;

    public SpeakerService(SpeakerRepository speakerRepository, EventRepository eventRepository) {
        this.speakerRepository = speakerRepository;
        this.eventRepository = eventRepository;
    }

    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + eventId));
    }

    public List<Speaker> list(Long eventId) {
        return speakerRepository.findByEvent(getEventOrThrow(eventId));
    }

    public Page<Speaker> list(Long eventId, Pageable pageable) {
        return speakerRepository.findByEvent(getEventOrThrow(eventId), pageable);
    }

    public Speaker create(Long eventId, Speaker payload) {
        Event event = getEventOrThrow(eventId);
        payload.setEvent(event);
        return speakerRepository.save(payload);
    }

    public Speaker update(Long eventId, Long id, Speaker payload) {
        Speaker existing = speakerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Speaker not found: " + id));
        if (!existing.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Speaker does not belong to event");
        }
        existing.setName(payload.getName());
        existing.setTitle(payload.getTitle());
        existing.setBio(payload.getBio());
        existing.setPhotoUrl(payload.getPhotoUrl());
        return speakerRepository.save(existing);
    }

    public void delete(Long eventId, Long id) {
        Speaker existing = speakerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Speaker not found: " + id));
        if (!existing.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Speaker does not belong to event");
        }
        speakerRepository.delete(existing);
    }
}
