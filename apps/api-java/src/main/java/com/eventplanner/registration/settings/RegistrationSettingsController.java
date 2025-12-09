package com.eventplanner.registration.settings;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/{eventId}/registration-settings")
@CrossOrigin(
        origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true"
)
public class RegistrationSettingsController {
    private final RegistrationSettingsService service;

    public RegistrationSettingsController(RegistrationSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<RegistrationSettingsDto> get(@PathVariable Long eventId) {
        return ResponseEntity.ok(service.getByEvent(eventId));
    }

    @PutMapping
    public ResponseEntity<RegistrationSettingsDto> update(@PathVariable Long eventId, @RequestBody RegistrationSettingsDto dto) {
        return ResponseEntity.ok(service.update(eventId, dto));
    }
}
