package com.eventplanner.planning;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@Transactional
public class SessionService {
    private final SessionRepository sessionRepository;
    private final SpeakerRepository speakerRepository;
    private final EventRepository eventRepository;

    public SessionService(SessionRepository sessionRepository,
                          SpeakerRepository speakerRepository,
                          EventRepository eventRepository) {
        this.sessionRepository = sessionRepository;
        this.speakerRepository = speakerRepository;
        this.eventRepository = eventRepository;
    }

    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + eventId));
    }

    @Cacheable(value = "sessions", key = "#eventId + ':list'")
    public List<Session> list(Long eventId) {
        return sessionRepository.findByEvent(getEventOrThrow(eventId));
    }

    @Cacheable(value = "sessions", key = "#eventId + ':page:' + #pageable")
    public Page<Session> list(Long eventId, Pageable pageable) {
        return sessionRepository.findByEvent(getEventOrThrow(eventId), pageable);
    }

    @CacheEvict(value = "sessions", allEntries = true)
    public Session create(Long eventId, Session payload) {
        Event event = getEventOrThrow(eventId);
        payload.setEvent(event);
        return sessionRepository.save(payload);
    }

    @CacheEvict(value = "sessions", allEntries = true)
    public Session update(Long eventId, Long id, Session payload) {
        Session existing = sessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + id));
        if (!existing.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Session does not belong to event");
        }
        existing.setTitle(payload.getTitle());
        existing.setDescription(payload.getDescription());
        existing.setStartTime(payload.getStartTime());
        existing.setEndTime(payload.getEndTime());
        existing.setRoom(payload.getRoom());
        existing.setTrack(payload.getTrack());
        existing.setCapacity(payload.getCapacity());
        return sessionRepository.save(existing);
    }

    @CacheEvict(value = "sessions", allEntries = true)
    public void delete(Long eventId, Long id) {
        Session existing = sessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + id));
        if (!existing.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Session does not belong to event");
        }
        sessionRepository.delete(existing);
    }

    @Cacheable(value = "sessions", key = "#eventId + ':between:' + #start + ':' + #end")
    public List<Session> listBetween(Long eventId, OffsetDateTime start, OffsetDateTime end) {
        return sessionRepository.findByEventAndStartTimeBetween(getEventOrThrow(eventId), start, end);
    }

    @Cacheable(value = "sessions", key = "#eventId + ':between:' + #start + ':' + #end + ':page:' + #pageable")
    public Page<Session> listBetween(Long eventId, OffsetDateTime start, OffsetDateTime end, Pageable pageable) {
        return sessionRepository.findByEventAndStartTimeBetween(getEventOrThrow(eventId), start, end, pageable);
    }

    @CacheEvict(value = "sessions", allEntries = true)
    public Session addSpeaker(Long eventId, Long sessionId, Long speakerId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
        if (!session.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Session does not belong to event");
        }
        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new IllegalArgumentException("Speaker not found: " + speakerId));
        if (!speaker.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Speaker does not belong to event");
        }
        Set<Speaker> speakers = session.getSpeakers();
        speakers.add(speaker);
        session.setSpeakers(speakers);
        return sessionRepository.save(session);
    }

    @CacheEvict(value = "sessions", allEntries = true)
    public Session removeSpeaker(Long eventId, Long sessionId, Long speakerId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
        if (!session.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Session does not belong to event");
        }
        Speaker speaker = speakerRepository.findById(speakerId)
                .orElseThrow(() -> new IllegalArgumentException("Speaker not found: " + speakerId));
        if (!speaker.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Speaker does not belong to event");
        }
        Set<Speaker> speakers = session.getSpeakers();
        speakers.removeIf(s -> s.getId().equals(speakerId));
        session.setSpeakers(speakers);
        return sessionRepository.save(session);
    }
}
