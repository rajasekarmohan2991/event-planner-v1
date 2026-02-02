package com.eventplanner.checkin;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class CheckInService {

    private final Map<Long, List<SseEmitter>> emittersByEvent = new ConcurrentHashMap<>();
    private final AtomicLong seq = new AtomicLong(1);

    public SseEmitter subscribe(Long eventId) {
        SseEmitter emitter = new SseEmitter(0L); // no timeout
        emittersByEvent.computeIfAbsent(eventId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> emittersByEvent.getOrDefault(eventId, List.of()).remove(emitter));
        emitter.onTimeout(() -> emittersByEvent.getOrDefault(eventId, List.of()).remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("ready").data("ok"));
        } catch (IOException ignored) {}
        return emitter;
    }

    public CheckInEvent checkInEvent(Long eventId, String code, String name, String attendeeId) {
        CheckInEvent ev = base(eventId, CheckInScope.EVENT, null, code, name, attendeeId);
        broadcast(eventId, ev);
        return ev;
    }

    public CheckInEvent checkInSession(Long eventId, Long sessionId, String code, String name, String attendeeId) {
        CheckInEvent ev = base(eventId, CheckInScope.SESSION, sessionId, code, name, attendeeId);
        broadcast(eventId, ev);
        return ev;
    }

    public CheckInEvent checkInZone(Long eventId, Long zoneId, String code, String name, String attendeeId) {
        CheckInEvent ev = base(eventId, CheckInScope.ZONE, zoneId, code, name, attendeeId);
        broadcast(eventId, ev);
        return ev;
    }

    public List<CheckInEvent> search(Long eventId, String q) {
        // TODO: wire to persistence. For now, return a mock filtered list
        return List.of();
    }

    private CheckInEvent base(Long eventId, CheckInScope scope, Long scopeRef, String code, String name, String attendeeId) {
        return CheckInEvent.builder()
                .id(String.valueOf(seq.getAndIncrement()))
                .eventId(eventId)
                .scope(scope)
                .scopeRef(scopeRef)
                .code(code)
                .name(name != null ? name : code)
                .attendeeId(attendeeId)
                .at(Instant.now())
                .build();
    }

    private void broadcast(Long eventId, CheckInEvent ev) {
        List<SseEmitter> list = emittersByEvent.getOrDefault(eventId, List.of());
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter em : list) {
            try {
                em.send(SseEmitter.event().name("checkin").data(ev, MediaType.APPLICATION_JSON));
            } catch (Exception ex) {
                dead.add(em);
            }
        }
        if (!dead.isEmpty()) {
            list.removeAll(dead);
        }
    }
}
