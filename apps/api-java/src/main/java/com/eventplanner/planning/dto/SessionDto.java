package com.eventplanner.planning.dto;

import java.time.OffsetDateTime;
import java.util.Set;

public record SessionDto(
        Long id,
        Long eventId,
        String title,
        String description,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        String room,
        String track,
        Integer capacity,
        Set<Long> speakerIds
) {}
