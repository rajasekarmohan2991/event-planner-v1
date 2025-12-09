package com.eventplanner.team.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class InviteMembersRequest {
    @NotEmpty
    private List<String> emails;

    @NotBlank
    private String role; // e.g., Event Staff
}
