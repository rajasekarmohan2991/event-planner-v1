package com.eventplanner.registration.approvals;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegistrationApprovalCreateRequest {
    @NotBlank
    private String name; // fallback to email if not provided by caller
    @NotBlank
    @Email
    private String email;
    @NotBlank
    private String ticketClass; // e.g., specific ticket or "RSVP"
}
