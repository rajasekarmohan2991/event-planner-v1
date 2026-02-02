package com.eventplanner.planning;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.eventplanner.util.PaginationUtils;
import java.util.Set;
import com.eventplanner.planning.dto.SpeakerDto;
import com.eventplanner.planning.mapper.SpeakerMapper;

@RestController
@RequestMapping("/api/events/{eventId}/speakers")
public class SpeakerController {

    private final SpeakerService speakerService;

    public SpeakerController(SpeakerService speakerService) {
        this.speakerService = speakerService;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @PathVariable("eventId") Long eventId,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size,
            @RequestParam(name = "sort", required = false, defaultValue = "name,asc") String sort
    ) {
        Set<String> allowed = PaginationUtils.set("name","title");
        Sort s = PaginationUtils.safeSort(sort, "name", allowed);
        Pageable pageable = PaginationUtils.pageable(page, size, s);
        Page<Speaker> result = speakerService.list(eventId, pageable);
        Page<SpeakerDto> dto = result.map(SpeakerMapper::toDto);
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<SpeakerDto> create(@PathVariable("eventId") Long eventId, @Valid @RequestBody Speaker payload) {
        return ResponseEntity.ok(SpeakerMapper.toDto(speakerService.create(eventId, payload)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SpeakerDto> update(@PathVariable("eventId") Long eventId, @PathVariable("id") Long id, @Valid @RequestBody Speaker payload) {
        return ResponseEntity.ok(SpeakerMapper.toDto(speakerService.update(eventId, id, payload)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("eventId") Long eventId, @PathVariable("id") Long id) {
        speakerService.delete(eventId, id);
        return ResponseEntity.noContent().build();
    }
}
