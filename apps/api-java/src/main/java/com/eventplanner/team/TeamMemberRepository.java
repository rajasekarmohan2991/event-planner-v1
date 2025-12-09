package com.eventplanner.team;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    Page<TeamMember> findByEventId(Long eventId, Pageable pageable);

    @Query("SELECT m FROM TeamMember m WHERE m.eventId = :eventId AND (LOWER(m.name) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(m.email) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<TeamMember> search(@Param("eventId") Long eventId, @Param("q") String q, Pageable pageable);
}
