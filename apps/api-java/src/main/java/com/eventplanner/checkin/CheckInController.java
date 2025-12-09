package com.eventplanner.checkin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;

    @PostMapping("/checkin")
    public ResponseEntity<CheckInEvent> checkInEvent(@PathVariable("eventId") Long eventId,
                                                     @RequestBody @Valid CheckInRequest body) {
        CheckInEvent ev = checkInService.checkInEvent(eventId, body.getCode(), body.getName(), body.getAttendeeId());
        return ResponseEntity.ok(ev);
    }

    @PostMapping("/sessions/{sessionId}/checkin")
    public ResponseEntity<CheckInEvent> checkInSession(@PathVariable("eventId") Long eventId,
                                                       @PathVariable("sessionId") Long sessionId,
                                                       @RequestBody @Valid CheckInRequest body) {
        CheckInEvent ev = checkInService.checkInSession(eventId, sessionId, body.getCode(), body.getName(), body.getAttendeeId());
        return ResponseEntity.ok(ev);
    }

    @PostMapping("/zones/{zoneId}/checkin")
    public ResponseEntity<CheckInEvent> checkInZone(@PathVariable("eventId") Long eventId,
                                                    @PathVariable("zoneId") Long zoneId,
                                                    @RequestBody @Valid CheckInRequest body) {
        CheckInEvent ev = checkInService.checkInZone(eventId, zoneId, body.getCode(), body.getName(), body.getAttendeeId());
        return ResponseEntity.ok(ev);
    }

    @GetMapping("/checkin/search")
    public ResponseEntity<List<CheckInEvent>> search(@PathVariable("eventId") Long eventId,
                                                     @RequestParam(name = "q", required = false) String q) {
        return ResponseEntity.ok(checkInService.search(eventId, q));
    }

    @GetMapping("/checkin/live")
    public SseEmitter live(@PathVariable("eventId") Long eventId) {
        return checkInService.subscribe(eventId);
    }
}
