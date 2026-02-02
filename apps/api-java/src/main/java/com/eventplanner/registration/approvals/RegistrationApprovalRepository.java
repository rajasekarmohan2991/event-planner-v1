package com.eventplanner.registration.approvals;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationApprovalRepository extends JpaRepository<RegistrationApproval, Long> {
    Page<RegistrationApproval> findByEventIdAndStatusOrderByCreatedAtDesc(Long eventId, String status, Pageable pageable);
    Page<RegistrationApproval> findByEventIdOrderByCreatedAtDesc(Long eventId, Pageable pageable);
}
