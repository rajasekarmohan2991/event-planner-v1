package com.eventplanner.planning;

import com.eventplanner.planning.dto.EventPlanningDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/{eventId}/planning")
public class EventPlanningController {

    private final EventPlanningService service;

    public EventPlanningController(EventPlanningService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<EventPlanningDto> get(@PathVariable("eventId") Long eventId) {
        EventPlanningDto dto = service.getByEventId(eventId);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
        
    }

    @PostMapping
    public ResponseEntity<EventPlanningDto> create(@PathVariable("eventId") Long eventId,
                                                   @RequestBody EventPlanningDto payload) {
        return ResponseEntity.ok(service.create(eventId, payload));
    }

    @PutMapping
    public ResponseEntity<EventPlanningDto> update(@PathVariable("eventId") Long eventId,
                                                   @RequestBody EventPlanningDto payload) {
        return ResponseEntity.ok(service.update(eventId, payload));
    }
}
