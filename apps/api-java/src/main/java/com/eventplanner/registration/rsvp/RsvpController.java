package com.eventplanner.registration.rsvp;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/rsvps")
@CrossOrigin(
        origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true"
)
public class RsvpController {
    private final RsvpService service;

    public RsvpController(RsvpService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<RsvpDto>> list(@PathVariable("eventId") Long eventId) {
        return ResponseEntity.ok(service.list(eventId));
    }

    @GetMapping("/{rsvpId}")
    public ResponseEntity<RsvpDto> get(@PathVariable("eventId") Long eventId, @PathVariable("rsvpId") Long rsvpId) {
        return ResponseEntity.ok(service.get(eventId, rsvpId));
    }

    @PostMapping
    public ResponseEntity<RsvpDto> create(@PathVariable("eventId") Long eventId, @RequestBody RsvpDto dto) {
        return ResponseEntity.ok(service.create(eventId, dto));
    }

    @PutMapping("/{rsvpId}")
    public ResponseEntity<RsvpDto> update(@PathVariable("eventId") Long eventId, @PathVariable("rsvpId") Long rsvpId, @RequestBody RsvpDto dto) {
        return ResponseEntity.ok(service.update(eventId, rsvpId, dto));
    }
}
