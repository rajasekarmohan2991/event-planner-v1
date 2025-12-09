package com.eventplanner.registration.payments;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByEventIdOrderByCreatedAtDesc(Long eventId);
    List<Payment> findByTicketIdOrderByCreatedAtDesc(Long ticketId);
    List<Payment> findByStatusOrderByCreatedAtDesc(String status);
}
