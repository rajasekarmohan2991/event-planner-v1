package com.eventplanner.team;

import com.eventplanner.team.dto.InviteMembersRequest;
import com.eventplanner.team.dto.TeamMemberResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/team")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping("/members")
    public ResponseEntity<Page<TeamMemberResponse>> listMembers(@PathVariable("eventId") Long eventId,
                                                                @RequestParam(name = "page", defaultValue = "1") int page,
                                                                @RequestParam(name = "limit", defaultValue = "10") int limit,
                                                                @RequestParam(name = "q", required = false) String q,
                                                                @RequestParam(name = "sortBy", required = false, defaultValue = "name") String sortBy,
                                                                @RequestParam(name = "sortDir", required = false, defaultValue = "ASC") String sortDir) {
        int pageIndex = Math.max(0, page - 1);
        int size = Math.max(1, Math.min(100, limit));
        org.springframework.data.domain.Sort.Direction direction = "DESC".equalsIgnoreCase(sortDir) ? org.springframework.data.domain.Sort.Direction.DESC : org.springframework.data.domain.Sort.Direction.ASC;
        // whitelist fields
        String field = switch (sortBy) {
            case "name", "email", "role", "status", "invitedAt", "joinedAt" -> sortBy;
            default -> "name";
        };
        Pageable pageable = PageRequest.of(pageIndex, size, org.springframework.data.domain.Sort.by(direction, field));
        return ResponseEntity.ok(teamService.listMembers(eventId, q, pageable));
    }

    @PostMapping("/invite")
    public ResponseEntity<List<TeamMemberResponse>> invite(@PathVariable("eventId") Long eventId,
                                                           @RequestBody @Valid InviteMembersRequest request) {
        return ResponseEntity.ok(teamService.invite(eventId, request));
    }

    @PostMapping("/reinvite")
    public ResponseEntity<TeamMemberResponse> reinvite(@PathVariable("eventId") Long eventId,
                                                       @RequestParam("email") String email) {
        return ResponseEntity.ok(teamService.reinvite(eventId, email));
    }

    @PostMapping("/approve")
    public ResponseEntity<TeamMemberResponse> approve(@PathVariable("eventId") Long eventId,
                                                      @RequestParam("email") String email) {
        return ResponseEntity.ok(teamService.approve(eventId, email));
    }

    // Email-link friendly GET endpoint (no auth) for approvals
    @GetMapping("/approve")
    public ResponseEntity<TeamMemberResponse> approveGet(@PathVariable("eventId") Long eventId,
                                                         @RequestParam("email") String email) {
        return ResponseEntity.ok(teamService.approve(eventId, email));
    }

    @PutMapping("/members/{memberId}")
    public ResponseEntity<TeamMemberResponse> update(@PathVariable("eventId") Long eventId,
                                                     @PathVariable("memberId") Long memberId,
                                                     @RequestParam(required = false) String role,
                                                     @RequestParam(required = false) TeamMemberStatus status) {
        return ResponseEntity.ok(teamService.updateMember(eventId, memberId, role, status));
    }

    @PostMapping("/reject")
    public ResponseEntity<TeamMemberResponse> reject(@PathVariable("eventId") Long eventId,
                                                     @RequestParam("email") String email) {
        return ResponseEntity.ok(teamService.reject(eventId, email));
    }

    // Email-link friendly GET endpoint (no auth) for rejections
    @GetMapping("/reject")
    public ResponseEntity<TeamMemberResponse> rejectGet(@PathVariable("eventId") Long eventId,
                                                        @RequestParam("email") String email) {
        return ResponseEntity.ok(teamService.reject(eventId, email));
    }

    @DeleteMapping("/members/{memberId}")
    public ResponseEntity<Void> delete(@PathVariable("eventId") Long eventId,
                                       @PathVariable("memberId") Long memberId) {
        teamService.deleteMember(eventId, memberId);
        return ResponseEntity.noContent().build();
    }
}
