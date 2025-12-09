package com.eventplanner.registration.tickets;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/events/{eventId}/tickets")
@CrossOrigin(
        origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true"
)
public class TicketController {
    private final TicketService service;

    public TicketController(TicketService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<TicketDto>> list(@PathVariable("eventId") Long eventId) {
        return ResponseEntity.ok(service.list(eventId));
    }

    @PostMapping
    public ResponseEntity<TicketDto> create(@PathVariable("eventId") Long eventId, @RequestBody TicketDto dto) {
        return ResponseEntity.ok(service.create(eventId, dto));
    }

    @PutMapping("/{ticketId}")
    public ResponseEntity<TicketDto> update(@PathVariable("eventId") Long eventId, @PathVariable("ticketId") Long ticketId, @RequestBody TicketDto dto) {
        return ResponseEntity.ok(service.update(eventId, ticketId, dto));
    }

    @DeleteMapping("/{ticketId}")
    public ResponseEntity<Void> delete(@PathVariable("eventId") Long eventId, @PathVariable("ticketId") Long ticketId) {
        service.delete(eventId, ticketId);
        return ResponseEntity.noContent().build();
    }
}
