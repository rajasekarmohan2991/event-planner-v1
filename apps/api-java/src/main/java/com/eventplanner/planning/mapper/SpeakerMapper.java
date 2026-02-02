package com.eventplanner.planning.mapper;

import com.eventplanner.planning.Speaker;
import com.eventplanner.planning.dto.SpeakerDto;

public final class SpeakerMapper {
    private SpeakerMapper() {}

    public static SpeakerDto toDto(Speaker s) {
        return new SpeakerDto(
                s.getId(),
                s.getEvent() != null ? s.getEvent().getId() : null,
                s.getName(),
                s.getTitle(),
                s.getBio(),
                s.getPhotoUrl()
        );
    }
}
