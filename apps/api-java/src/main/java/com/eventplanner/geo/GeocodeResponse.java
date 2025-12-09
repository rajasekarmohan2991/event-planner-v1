package com.eventplanner.geo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeocodeResponse {
    private String city;
    private Double lat;
    private Double lon;
}
