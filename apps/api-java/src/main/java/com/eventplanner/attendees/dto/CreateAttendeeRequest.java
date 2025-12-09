package com.eventplanner.attendees.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateAttendeeRequest {
    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    private String phone;

    // JSON string of answers keyed by fieldKey
    private String answersJson;
}
