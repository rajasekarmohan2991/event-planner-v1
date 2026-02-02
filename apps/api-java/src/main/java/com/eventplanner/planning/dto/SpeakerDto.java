package com.eventplanner.planning.dto;

public record SpeakerDto(
        Long id,
        Long eventId,
        String name,
        String title,
        String bio,
        String photoUrl
) {}
