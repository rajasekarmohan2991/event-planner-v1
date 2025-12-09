package com.eventplanner.microsite.mapper;

import com.eventplanner.microsite.MicrositeSection;
import com.eventplanner.microsite.dto.MicrositeSectionDto;

public final class MicrositeSectionMapper {
    private MicrositeSectionMapper() {}

    public static MicrositeSectionDto toDto(MicrositeSection s) {
        return new MicrositeSectionDto(
                s.getId(),
                s.getEvent() != null ? s.getEvent().getId() : null,
                s.getType() != null ? s.getType().name() : null,
                s.getTitle(),
                s.getPosition(),
                s.getContent(),
                s.getVisible()
        );
    }
}
