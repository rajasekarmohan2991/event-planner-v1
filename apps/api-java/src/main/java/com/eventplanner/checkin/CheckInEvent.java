package com.eventplanner.checkin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInEvent {
    private String id;
    private Long eventId;
    private CheckInScope scope; // EVENT/SESSION/ZONE
    private Long scopeRef; // sessionId or zoneId when applicable

    private String attendeeId;
    private String name;
    private String code;

    private Instant at;
}
