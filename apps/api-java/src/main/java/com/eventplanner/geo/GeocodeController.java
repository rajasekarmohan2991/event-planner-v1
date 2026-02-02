package com.eventplanner.geo;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/geo")
@RequiredArgsConstructor
public class GeocodeController {

    private final GeocodeService geocodeService;

    @GetMapping("/city")
    public ResponseEntity<GeocodeResponse> geocode(@RequestParam("q") String city) {
        GeocodeResponse res = geocodeService.geocodeCity(city);
        if (res == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(res);
    }
}
