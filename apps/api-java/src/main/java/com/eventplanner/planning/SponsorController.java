package com.eventplanner.planning;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.eventplanner.util.PaginationUtils;
import java.util.Set;
import com.eventplanner.planning.dto.SponsorDto;
import com.eventplanner.planning.mapper.SponsorMapper;

@RestController
@RequestMapping("/api/events/{eventId}/sponsors")
public class SponsorController {

    private final SponsorService sponsorService;

    public SponsorController(SponsorService sponsorService) {
        this.sponsorService = sponsorService;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @PathVariable("eventId") Long eventId,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size,
            @RequestParam(name = "sort", required = false, defaultValue = "tier,asc") String sort
    ) {
        Set<String> allowed = PaginationUtils.set("tier","name");
        Sort s = PaginationUtils.safeSort(sort, "tier", allowed);
        Pageable pageable = PaginationUtils.pageable(page, size, s);
        Page<Sponsor> result = sponsorService.list(eventId, pageable);
        Page<SponsorDto> dto = result.map(SponsorMapper::toDto);
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<SponsorDto> create(@PathVariable("eventId") Long eventId, @Valid @RequestBody Sponsor payload) {
        return ResponseEntity.ok(SponsorMapper.toDto(sponsorService.create(eventId, payload)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SponsorDto> update(@PathVariable("eventId") Long eventId, @PathVariable("id") Long id, @Valid @RequestBody Sponsor payload) {
        return ResponseEntity.ok(SponsorMapper.toDto(sponsorService.update(eventId, id, payload)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("eventId") Long eventId, @PathVariable("id") Long id) {
        sponsorService.delete(eventId, id);
        return ResponseEntity.noContent().build();
    }
}
