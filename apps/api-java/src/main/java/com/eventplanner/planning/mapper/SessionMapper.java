package com.eventplanner.planning.mapper;

import com.eventplanner.planning.Session;
import com.eventplanner.planning.Speaker;
import com.eventplanner.planning.dto.SessionDto;

import java.util.Set;
import java.util.stream.Collectors;

public final class SessionMapper {
    private SessionMapper() {}

    public static SessionDto toDto(Session s) {
        Set<Long> speakerIds = s.getSpeakers() == null ? Set.of() : s.getSpeakers().stream()
                .map(Speaker::getId)
                .collect(Collectors.toSet());
        return new SessionDto(
                s.getId(),
                s.getEvent() != null ? s.getEvent().getId() : null,
                s.getTitle(),
                s.getDescription(),
                s.getStartTime(),
                s.getEndTime(),
                s.getRoom(),
                s.getTrack(),
                s.getCapacity(),
                speakerIds
        );
    }
}
