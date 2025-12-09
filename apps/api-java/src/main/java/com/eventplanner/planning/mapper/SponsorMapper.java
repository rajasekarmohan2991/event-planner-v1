package com.eventplanner.planning.mapper;

import com.eventplanner.planning.Sponsor;
import com.eventplanner.planning.dto.SponsorDto;

public final class SponsorMapper {
    private SponsorMapper() {}

    public static SponsorDto toDto(Sponsor s) {
        return new SponsorDto(
                s.getId(),
                s.getEvent() != null ? s.getEvent().getId() : null,
                s.getName(),
                s.getTier() != null ? s.getTier().name() : null,
                s.getLogoUrl(),
                s.getWebsite()
        );
    }
}
