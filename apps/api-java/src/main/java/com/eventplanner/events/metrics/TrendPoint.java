package com.eventplanner.events.metrics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrendPoint {
    private String date; // ISO yyyy-MM-dd
    private int count;
}
