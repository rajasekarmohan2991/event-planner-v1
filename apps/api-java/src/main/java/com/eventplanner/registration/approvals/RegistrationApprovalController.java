package com.eventplanner.registration.approvals;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true"
)
public class RegistrationApprovalController {

    private final RegistrationApprovalService service;

    @PostMapping("/approvals")
    public ResponseEntity<RegistrationApprovalDto> create(
            @PathVariable("eventId") Long eventId,
            @RequestBody RegistrationApprovalCreateRequest req
    ) {
        return ResponseEntity.ok(service.create(eventId, req));
    }

    @GetMapping("/approvals")
    public ResponseEntity<List<RegistrationApprovalDto>> list(
            @PathVariable("eventId") Long eventId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.list(eventId, status, page, size));
    }

    @PostMapping("/approvals/{approvalId}/approve")
    public ResponseEntity<RegistrationApprovalDto> approve(
            @PathVariable("eventId") Long eventId,
            @PathVariable("approvalId") Long approvalId
    ) {
        return ResponseEntity.ok(service.approve(eventId, approvalId));
    }

    @PostMapping("/approvals/{approvalId}/reject")
    public ResponseEntity<RegistrationApprovalDto> reject(
            @PathVariable("eventId") Long eventId,
            @PathVariable("approvalId") Long approvalId
    ) {
        return ResponseEntity.ok(service.reject(eventId, approvalId));
    }
}
