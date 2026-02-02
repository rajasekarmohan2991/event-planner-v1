package com.eventplanner.registration.rsvp;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class RsvpService {
    private final RsvpRepository repo;
    private final EventRepository events;

    public RsvpService(RsvpRepository repo, EventRepository events) {
        this.repo = repo;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public List<RsvpDto> list(Long eventId) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        return repo.findByEvent(e).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RsvpDto get(Long eventId, Long id) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        Rsvp r = repo.findById(id).orElseThrow(() -> new NoSuchElementException("RSVP not found"));
        if (!r.getEvent().getId().equals(e.getId())) throw new NoSuchElementException("RSVP not in event");
        return toDto(r);
    }

    @Transactional
    public RsvpDto create(Long eventId, RsvpDto dto) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        Rsvp r = Rsvp.builder()
                .event(e)
                .name(dto.name)
                .email(dto.email)
                .status(dto.status != null ? dto.status : RsvpStatus.MAYBE)
                .plusOne(dto.plusOne != null ? dto.plusOne : 0)
                .answersJson(dto.answersJson)
                .build();
        return toDto(repo.save(r));
    }

    @Transactional
    public RsvpDto update(Long eventId, Long id, RsvpDto dto) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        Rsvp r = repo.findById(id).orElseThrow(() -> new NoSuchElementException("RSVP not found"));
        if (!r.getEvent().getId().equals(e.getId())) throw new NoSuchElementException("RSVP not in event");
        if (dto.name != null) r.setName(dto.name);
        if (dto.email != null) r.setEmail(dto.email);
        if (dto.status != null) r.setStatus(dto.status);
        if (dto.plusOne != null) r.setPlusOne(dto.plusOne);
        if (dto.answersJson != null) r.setAnswersJson(dto.answersJson);
        return toDto(repo.save(r));
    }

    private RsvpDto toDto(Rsvp r) {
        RsvpDto d = new RsvpDto();
        d.id = r.getId();
        d.eventId = r.getEvent().getId();
        d.name = r.getName();
        d.email = r.getEmail();
        d.status = r.getStatus();
        d.plusOne = r.getPlusOne();
        d.answersJson = r.getAnswersJson();
        d.createdAt = r.getCreatedAt();
        d.updatedAt = r.getUpdatedAt();
        return d;
    }
}
