package com.eventplanner.planning;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.eventplanner.util.PaginationUtils;
import java.util.Set;
import com.eventplanner.planning.dto.SessionDto;
import com.eventplanner.planning.mapper.SessionMapper;

@RestController
@RequestMapping("/api/events/{eventId}/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @PathVariable("eventId") Long eventId,
            @RequestParam(name = "start", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime start,
            @RequestParam(name = "end", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime end,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size,
            @RequestParam(name = "sort", required = false, defaultValue = "startTime,asc") String sort
    ) {
        Set<String> allowed = PaginationUtils.set("startTime","endTime","title","track","room","capacity");
        Sort s = PaginationUtils.safeSort(sort, "startTime", allowed);
        Pageable pageable = PaginationUtils.pageable(page, size, s);

        if (start != null && end != null) {
            Page<Session> result = sessionService.listBetween(eventId, start, end, pageable);
            Page<SessionDto> dto = result.map(SessionMapper::toDto);
            return ResponseEntity.ok(dto);
        }
        Page<Session> result = sessionService.list(eventId, pageable);
        Page<SessionDto> dto = result.map(SessionMapper::toDto);
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<SessionDto> create(@PathVariable("eventId") Long eventId, @Valid @RequestBody Session payload) {
        return ResponseEntity.ok(SessionMapper.toDto(sessionService.create(eventId, payload)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SessionDto> update(@PathVariable("eventId") Long eventId, @PathVariable("id") Long id, @Valid @RequestBody Session payload) {
        return ResponseEntity.ok(SessionMapper.toDto(sessionService.update(eventId, id, payload)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("eventId") Long eventId, @PathVariable("id") Long id) {
        sessionService.delete(eventId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/speakers/{speakerId}")
    public ResponseEntity<SessionDto> addSpeaker(@PathVariable("eventId") Long eventId, @PathVariable("id") Long sessionId, @PathVariable("speakerId") Long speakerId) {
        return ResponseEntity.ok(SessionMapper.toDto(sessionService.addSpeaker(eventId, sessionId, speakerId)));
    }

    @DeleteMapping("/{id}/speakers/{speakerId}")
    public ResponseEntity<SessionDto> removeSpeaker(@PathVariable("eventId") Long eventId, @PathVariable("id") Long sessionId, @PathVariable("speakerId") Long speakerId) {
        return ResponseEntity.ok(SessionMapper.toDto(sessionService.removeSpeaker(eventId, sessionId, speakerId)));
    }
}
