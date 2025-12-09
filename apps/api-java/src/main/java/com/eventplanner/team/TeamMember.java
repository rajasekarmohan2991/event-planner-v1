package com.eventplanner.team;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "event_team_members", indexes = {
        @Index(name = "idx_event_member_event", columnList = "event_id"),
        @Index(name = "idx_event_member_email", columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String role; // e.g., Event Staff, Event Owner

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeamMemberStatus status; // INVITED, JOINED

    @Column(name = "invited_at")
    private Instant invitedAt;

    @Column(name = "joined_at")
    private Instant joinedAt;

    @Column(name = "progress")
    private Integer progress; // 0-100

    // Explicit accessors to ensure compilation if Lombok annotation processing is unavailable
    public Long getId() { return this.id; }
    public void setId(Long id) { this.id = id; }
    public Long getEventId() { return this.eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public String getName() { return this.name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return this.email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return this.role; }
    public void setRole(String role) { this.role = role; }
    public TeamMemberStatus getStatus() { return this.status; }
    public void setStatus(TeamMemberStatus status) { this.status = status; }
    public Instant getInvitedAt() { return this.invitedAt; }
    public void setInvitedAt(Instant invitedAt) { this.invitedAt = invitedAt; }
    public Instant getJoinedAt() { return this.joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }
    public Integer getProgress() { return this.progress; }
    public void setProgress(Integer progress) { this.progress = progress; }
}
