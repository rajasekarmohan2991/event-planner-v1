package com.eventplanner.team.dto;

import com.eventplanner.team.TeamMemberStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMemberResponse {
    private Long id;
    private Long eventId;
    private String name;
    private String email;
    private String role;
    private TeamMemberStatus status;
    private Instant invitedAt;
    private Instant joinedAt;
    private Integer progress;
}
