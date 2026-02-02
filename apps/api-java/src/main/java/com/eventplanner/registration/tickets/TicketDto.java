package com.eventplanner.registration.tickets;

import java.time.OffsetDateTime;

public class TicketDto {
    public Long id;
    public Long eventId;
    public String name;
    public String groupId;
    public boolean free;
    public Integer priceInMinor;
    public String currency;
    public Integer quantity;
    public Integer sold;
    public boolean requiresApproval;
    public String status;
    public OffsetDateTime salesStartAt;
    public OffsetDateTime salesEndAt;
}
