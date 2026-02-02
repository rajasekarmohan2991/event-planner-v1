package com.eventplanner.registration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationSettingsDto {
    private Long eventId;
    private boolean isOpen;
    private OffsetDateTime deadlineAt;
    private Integer capacity;
    private boolean waitlistEnabled;
    private boolean requireRsvp;
    private Long confirmationTemplateId;
}
