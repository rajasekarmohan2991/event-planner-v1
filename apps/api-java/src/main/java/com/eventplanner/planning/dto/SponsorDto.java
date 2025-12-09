package com.eventplanner.planning.dto;

public record SponsorDto(
        Long id,
        Long eventId,
        String name,
        String tier,
        String logoUrl,
        String website
) {}
