package com.eventplanner.team;

import com.eventplanner.team.dto.InviteMembersRequest;
import com.eventplanner.team.dto.TeamMemberResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamMemberRepository repository;
    private final com.eventplanner.util.EmailService emailService;

    public Page<TeamMemberResponse> listMembers(Long eventId, String q, Pageable pageable) {
        Page<TeamMember> page = (q != null && !q.isBlank())
                ? repository.search(eventId, q, pageable)
                : repository.findByEventId(eventId, pageable);
        List<TeamMemberResponse> items = page.getContent().stream().map(this::toResp).collect(Collectors.toList());

        // Ensure logged-in member appears in the portal members list (view-only augmentation)
        try {
            Authentication auth = SecurityContextHolder.getContext() != null ? SecurityContextHolder.getContext().getAuthentication() : null;
            if (auth != null && auth.isAuthenticated()) {
                String email = auth.getName();
                if (email != null && !email.isBlank()) {
                    boolean exists = items.stream().anyMatch(m -> email.equalsIgnoreCase(m.getEmail()));
                    // Only inject on the first page to avoid duplicating across pages
                    if (!exists && pageable.getPageNumber() == 0) {
                        String name = email;
                        int at = email.indexOf('@');
                        if (at > 0) name = email.substring(0, at);
                        TeamMemberResponse self = TeamMemberResponse.builder()
                                .id(null)
                                .eventId(eventId)
                                .name(name)
                                .email(email)
                                .role("Organizer")
                                .status(TeamMemberStatus.JOINED)
                                .invitedAt(null)
                                .joinedAt(Instant.now())
                                .progress(100)
                                .build();
                        items.add(0, self);
                        return new PageImpl<>(items, pageable, page.getTotalElements() + 1);
                    }
                }
            }
        } catch (Exception ignored) { }

        return new PageImpl<>(items, pageable, page.getTotalElements());
    }

    public List<TeamMemberResponse> invite(Long eventId, InviteMembersRequest req) {
        Instant now = Instant.now();
        List<TeamMember> saved = req.getEmails().stream()
                .map(s -> s == null ? "" : s.trim())
                .filter(s -> !s.isEmpty())
                .distinct()
                .map(email -> {
                    String name = email;
                    int at = email.indexOf('@');
                    if (at > 0) {
                        name = email.substring(0, at);
                    }
                    return TeamMember.builder()
                            .eventId(eventId)
                            .name(name)
                            .email(email)
                            .role(req.getRole())
                            .status(TeamMemberStatus.INVITED)
                            .invitedAt(now)
                            .progress(8)
                            .build();
                })
                .map(repository::save)
                .collect(Collectors.toList());
        // Send invitation emails best-effort
        for (TeamMember m : saved) {
            try {
                emailService.sendInviteEmail(m.getEmail(), m.getName(), m.getRole(), eventId);
            } catch (Exception ignored) {
                // Do not fail invitation flow if email sending fails
            }
        }
        return saved.stream().map(this::toResp).collect(Collectors.toList());
    }

    public TeamMemberResponse reinvite(Long eventId, String email) {
        // simple reinvite: update invitedAt for the most recent matching member
        TeamMember updated = repository.findByEventId(eventId, Pageable.ofSize(100)).getContent().stream()
                .filter(m -> m.getEmail().equalsIgnoreCase(email))
                .findFirst()
                .map(m -> {
                    m.setInvitedAt(Instant.now());
                    return repository.save(m);
                })
                .orElseGet(() -> repository.save(TeamMember.builder()
                        .eventId(eventId)
                        .name(email.contains("@") ? email.substring(0, email.indexOf('@')) : email)
                        .email(email)
                        .role("Event Staff")
                        .status(TeamMemberStatus.INVITED)
                        .invitedAt(Instant.now())
                        .progress(0)
                        .build()))
                ;
        return toResp(updated);
    }

    public TeamMemberResponse approve(Long eventId, String email) {
        Instant now = Instant.now();
        TeamMember updated = repository.findByEventId(eventId, Pageable.ofSize(100)).getContent().stream()
                .filter(m -> m.getEmail().equalsIgnoreCase(email))
                .findFirst()
                .map(m -> {
                    m.setStatus(TeamMemberStatus.JOINED);
                    m.setJoinedAt(now);
                    return repository.save(m);
                })
                .orElseGet(() -> repository.save(TeamMember.builder()
                        .eventId(eventId)
                        .name(email.contains("@") ? email.substring(0, email.indexOf('@')) : email)
                        .email(email)
                        .role("Event Staff")
                        .status(TeamMemberStatus.JOINED)
                        .invitedAt(now)
                        .joinedAt(now)
                        .progress(8)
                        .build()));
        return toResp(updated);
    }

    public TeamMemberResponse reject(Long eventId, String email) {
        TeamMember updated = repository.findByEventId(eventId, Pageable.ofSize(100)).getContent().stream()
                .filter(m -> m.getEmail().equalsIgnoreCase(email))
                .findFirst()
                .map(m -> {
                    m.setStatus(TeamMemberStatus.REJECTED);
                    return repository.save(m);
                })
                .orElseGet(() -> repository.save(TeamMember.builder()
                        .eventId(eventId)
                        .name(email.contains("@") ? email.substring(0, email.indexOf('@')) : email)
                        .email(email)
                        .role("Event Staff")
                        .status(TeamMemberStatus.REJECTED)
                        .invitedAt(Instant.now())
                        .progress(0)
                        .build()));
        return toResp(updated);
    }

    public TeamMemberResponse updateMember(Long eventId, Long memberId, String role, TeamMemberStatus status) {
        TeamMember m = repository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        if (!m.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Member does not belong to event");
        }
        if (role != null && !role.isBlank()) {
            m.setRole(role);
        }
        if (status != null) {
            m.setStatus(status);
            if (status == TeamMemberStatus.JOINED && m.getJoinedAt() == null) {
                m.setJoinedAt(Instant.now());
            }
        }
        return toResp(repository.save(m));
    }

    public void deleteMember(Long eventId, Long memberId) {
        TeamMember m = repository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        if (!m.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Member does not belong to event");
        }
        repository.deleteById(memberId);
    }

    private TeamMemberResponse toResp(TeamMember m) {
        return TeamMemberResponse.builder()
                .id(m.getId())
                .eventId(m.getEventId())
                .name(m.getName())
                .email(m.getEmail())
                .role(m.getRole())
                .status(m.getStatus())
                .invitedAt(m.getInvitedAt())
                .joinedAt(m.getJoinedAt())
                .progress(m.getProgress())
                .build();
    }
}
