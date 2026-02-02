package com.eventplanner.events.metrics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventStatsDto {
    private long ticketSalesInr;
    private long registrations;
    private long daysToEvent;
    private Map<String, Integer> counts; // sessions, speakers, team, sponsors, exhibitors, badges
}
