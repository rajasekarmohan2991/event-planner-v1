package com.eventplanner.planning;

import com.eventplanner.planning.dto.AgendaDayDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/agenda")
public class AgendaController {

    private final AgendaService agendaService;

    public AgendaController(AgendaService agendaService) {
        this.agendaService = agendaService;
    }

    @GetMapping
    public ResponseEntity<List<AgendaDayDto>> getAgenda(@PathVariable Long eventId,
                                                        @RequestParam(required = false, defaultValue = "day,track") String groupBy) {
        // Currently groups by day then track; groupBy reserved for future extensions
        return ResponseEntity.ok(agendaService.getAgenda(eventId));
    }
}
