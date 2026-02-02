package com.eventplanner.registration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationFieldDto {
    private Long id;
    @NotBlank
    private String fieldKey;
    @NotBlank
    private String label;
    @NotBlank
    private String fieldType; // text, number, select, etc.
    @NotNull
    private Boolean required;
    private String optionsJson; // JSON string (null for non-select types)
    @NotNull
    private Integer orderIndex;
    @NotBlank
    private String visibility; // PUBLIC/PRIVATE
    private String logicJson; // conditional logic JSON
}
