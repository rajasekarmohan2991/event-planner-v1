package com.eventplanner.microsite.dto;

public record MicrositeThemeDto(
        Long id,
        Long eventId,
        String primaryColor,
        String secondaryColor,
        String backgroundColor,
        String textColor,
        String fontFamily,
        String heroImageUrl
) {}
