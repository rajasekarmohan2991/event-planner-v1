package com.eventplanner.microsite.mapper;

import com.eventplanner.microsite.MicrositeTheme;
import com.eventplanner.microsite.dto.MicrositeThemeDto;

public final class MicrositeThemeMapper {
    private MicrositeThemeMapper() {}

    public static MicrositeThemeDto toDto(MicrositeTheme t) {
        return new MicrositeThemeDto(
                t.getId(),
                t.getEvent() != null ? t.getEvent().getId() : null,
                t.getPrimaryColor(),
                t.getSecondaryColor(),
                t.getBackgroundColor(),
                t.getTextColor(),
                t.getFontFamily(),
                t.getHeroImageUrl()
        );
    }
}
