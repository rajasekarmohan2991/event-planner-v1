package com.eventplanner.registration;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/{eventId}")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping("/registrations")
    public ResponseEntity<RegistrationResponse> create(
            @PathVariable("eventId") Long eventId,
            @RequestBody @Valid RegistrationRequest request
    ) {
        return ResponseEntity.ok(registrationService.create(eventId, request));
    }

    @GetMapping("/registrations")
    public ResponseEntity<?> list(
            @PathVariable("eventId") Long eventId,
            @RequestParam(value = "type", required = false) String type
    ) {
        RegistrationType rt = null;
        if (type != null && !type.isBlank()) {
            try { rt = RegistrationType.valueOf(type.trim().toUpperCase()); } catch (IllegalArgumentException ignored) {}
        }
        return ResponseEntity.ok(registrationService.listByEvent(eventId, rt));
    }

    @GetMapping("/registrations/{id}")
    public ResponseEntity<?> getOne(
            @PathVariable("eventId") Long eventId,
            @PathVariable("id") Long id
    ) {
        RegistrationResponse res = registrationService.getOne(eventId, id);
        if (res == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(res);
    }

    @PutMapping("/registrations/{id}")
    public ResponseEntity<?> update(
            @PathVariable("eventId") Long eventId,
            @PathVariable("id") Long id,
            @RequestBody @Valid RegistrationRequest request
    ) {
        RegistrationResponse res = registrationService.update(eventId, id, request);
        if (res == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/registrations/{id}")
    public ResponseEntity<?> delete(
            @PathVariable("eventId") Long eventId,
            @PathVariable("id") Long id
    ) {
        boolean ok = registrationService.delete(eventId, id);
        if (!ok) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }
}
