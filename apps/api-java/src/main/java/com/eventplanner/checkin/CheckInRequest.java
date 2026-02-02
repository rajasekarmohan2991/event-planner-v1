package com.eventplanner.checkin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CheckInRequest {
    @NotBlank
    private String code;

    private String name; // optional, fallback to code
    private String attendeeId; // optional
}
