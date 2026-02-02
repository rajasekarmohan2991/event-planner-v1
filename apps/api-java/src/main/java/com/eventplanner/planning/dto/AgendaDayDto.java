package com.eventplanner.planning.dto;

import java.time.LocalDate;
import java.util.List;

public record AgendaDayDto(
        LocalDate date,
        List<AgendaTrackDto> tracks
) {}
