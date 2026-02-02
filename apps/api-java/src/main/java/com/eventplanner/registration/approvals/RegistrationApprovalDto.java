package com.eventplanner.registration.approvals;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationApprovalDto {
    private Long id;
    private Long eventId;
    private String name;
    private String email;
    private String ticketClass;
    private String status; // PENDING, APPROVED, REJECTED
    private Instant createdAt;
}
