package com.eventplanner.microsite.dto;

public record MicrositeSectionDto(
        Long id,
        Long eventId,
        String type,
        String title,
        Integer position,
        String content,
        Boolean visible
) {}
