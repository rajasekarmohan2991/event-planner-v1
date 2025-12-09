package com.eventplanner.registration.rsvp;

import java.time.OffsetDateTime;

public class RsvpDto {
    public Long id;
    public Long eventId;
    public String name;
    public String email;
    public RsvpStatus status;
    public Integer plusOne;
    public String answersJson;
    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
