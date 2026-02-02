package com.eventplanner.planning.dto;

import java.util.List;

public record AgendaTrackDto(
        String track,
        List<SessionDto> sessions
) {}
