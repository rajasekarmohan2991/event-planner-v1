package com.eventplanner.attendees;

import com.eventplanner.attendees.dto.CreateAttendeeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/{eventId}")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true"
)
public class AttendeeController {

    private final AttendeeService attendeeService;

    @PostMapping("/attendees")
    public ResponseEntity<Attendee> create(
            @PathVariable("eventId") Long eventId,
            @Valid @RequestBody CreateAttendeeRequest request
    ) {
        return ResponseEntity.ok(attendeeService.create(eventId, request));
    }
}
