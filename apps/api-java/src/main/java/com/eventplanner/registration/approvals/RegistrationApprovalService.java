package com.eventplanner.registration.approvals;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistrationApprovalService {

    private final RegistrationApprovalRepository repository;

    public List<RegistrationApprovalDto> list(Long eventId, String status, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        Page<RegistrationApproval> p = (status == null || status.isBlank())
                ? repository.findByEventIdOrderByCreatedAtDesc(eventId, pr)
                : repository.findByEventIdAndStatusOrderByCreatedAtDesc(eventId, status.toUpperCase(), pr);
        return p.getContent().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public RegistrationApprovalDto create(Long eventId, RegistrationApprovalCreateRequest req) {
        RegistrationApproval ra = RegistrationApproval.builder()
                .eventId(eventId)
                .name((req.getName() == null || req.getName().isBlank()) ? req.getEmail() : req.getName())
                .email(req.getEmail())
                .ticketClass(req.getTicketClass())
                .status("PENDING")
                .build();
        RegistrationApproval saved = repository.save(ra);
        return toDto(saved);
    }

    @Transactional
    public RegistrationApprovalDto approve(Long eventId, Long approvalId) {
        RegistrationApproval ra = repository.findById(approvalId)
                .orElseThrow(() -> new IllegalArgumentException("Approval not found"));
        if (!ra.getEventId().equals(eventId)) throw new IllegalArgumentException("Event mismatch");
        ra.setStatus("APPROVED");
        RegistrationApproval saved = repository.save(ra);
        return toDto(saved);
    }

    @Transactional
    public RegistrationApprovalDto reject(Long eventId, Long approvalId) {
        RegistrationApproval ra = repository.findById(approvalId)
                .orElseThrow(() -> new IllegalArgumentException("Approval not found"));
        if (!ra.getEventId().equals(eventId)) throw new IllegalArgumentException("Event mismatch");
        ra.setStatus("REJECTED");
        RegistrationApproval saved = repository.save(ra);
        return toDto(saved);
    }

    private RegistrationApprovalDto toDto(RegistrationApproval e) {
        return RegistrationApprovalDto.builder()
                .id(e.getId())
                .eventId(e.getEventId())
                .name(e.getName())
                .email(e.getEmail())
                .ticketClass(e.getTicketClass())
                .status(e.getStatus())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
