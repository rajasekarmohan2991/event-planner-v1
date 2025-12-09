package com.eventplanner.registration.payments;

import java.time.OffsetDateTime;

public class PaymentDto {
    public Long id;
    public Long eventId;
    public Long ticketId;
    public String ticketName;
    public String stripePaymentIntentId;
    public Integer amountInMinor;
    public String currency;
    public String status;
    public String metadataJson;
    public OffsetDateTime createdAt;
}
