package com.eventplanner.registration.promocodes;

import java.time.OffsetDateTime;

public class PromoCodeDto {
    public Long id;
    public Long eventId;
    public String code;
    public String discountType;
    public Integer discountAmount;
    public Integer maxUses;
    public Integer usedCount;
    public Integer maxUsesPerUser;
    public Integer minOrderAmount;
    public String applicableTicketIds;
    public OffsetDateTime startDate;
    public OffsetDateTime endDate;
    public Boolean isActive;
    public String description;
    public OffsetDateTime createdAt;
}
