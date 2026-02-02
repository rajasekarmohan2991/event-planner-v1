package com.eventplanner.geo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService service;

    public LocationController(LocationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<LocationDto> createOrFind(@RequestBody LocationDto payload) {
        Location loc = service.findOrCreate(payload);
        return ResponseEntity.ok(service.toDto(loc));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocationDto> get(@PathVariable("id") Long id) {
        return ResponseEntity.of(service.findById(id).map(service::toDto));
    }
}
