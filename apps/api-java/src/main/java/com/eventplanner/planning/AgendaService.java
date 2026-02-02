package com.eventplanner.planning;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import com.eventplanner.planning.dto.AgendaDayDto;
import com.eventplanner.planning.dto.AgendaTrackDto;
import com.eventplanner.planning.dto.SessionDto;
import com.eventplanner.planning.mapper.SessionMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AgendaService {

    private final EventRepository eventRepository;
    private final SessionRepository sessionRepository;

    public AgendaService(EventRepository eventRepository, SessionRepository sessionRepository) {
        this.eventRepository = eventRepository;
        this.sessionRepository = sessionRepository;
    }

    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + eventId));
    }

    @Cacheable(value = "agenda", key = "#eventId")
    public List<AgendaDayDto> getAgenda(Long eventId) {
        Event event = getEventOrThrow(eventId);
        // fetch all sessions for event; DB already has indexes on time
        List<Session> sessions = sessionRepository.findByEvent(event)
                .stream()
                .sorted(Comparator.comparing(Session::getStartTime))
                .toList();

        // Map<LocalDate, Map<Track, List<SessionDto>>>
        Map<LocalDate, Map<String, List<SessionDto>>> grouped = new LinkedHashMap<>();
        for (Session s : sessions) {
            LocalDate day = s.getStartTime().atZoneSameInstant(ZoneOffset.UTC).toLocalDate();
            String track = s.getTrack() == null ? "General" : s.getTrack();
            grouped
                .computeIfAbsent(day, d -> new LinkedHashMap<>())
                .computeIfAbsent(track, t -> new ArrayList<>())
                .add(SessionMapper.toDto(s));
        }

        // Build DTO list keeping insertion order
        List<AgendaDayDto> days = new ArrayList<>();
        for (Map.Entry<LocalDate, Map<String, List<SessionDto>>> dayEntry : grouped.entrySet()) {
            List<AgendaTrackDto> tracks = dayEntry.getValue().entrySet().stream()
                    .map(e -> new AgendaTrackDto(e.getKey(), e.getValue().stream()
                            .sorted(Comparator.comparing(SessionDto::startTime))
                            .collect(Collectors.toList())))
                    .collect(Collectors.toList());
            days.add(new AgendaDayDto(dayEntry.getKey(), tracks));
        }
        return days;
    }
}
