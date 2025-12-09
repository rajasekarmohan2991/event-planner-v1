package com.eventplanner.registration;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class RegistrationRequest {
    @NotNull
    private RegistrationType type;

    // Arbitrary fields per registration type
    private Map<String, Object> data;
}
