package com.eventplanner.registration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationResponse {
    private String id;
    private Long eventId;
    private RegistrationType type;
    private String status; // e.g., CREATED
}
