package com.eventplanner.registration.reports;

public class PromoCodeAnalyticsDto {
    public Long totalPromoCodes;
    public Long activePromoCodes;
    public Long totalUses;
    public Double totalDiscountAmount;
    public Double averageDiscountAmount;
    public String mostUsedPromoCode;
    public Long mostUsedPromoCount;
    public String promoCodeUsage; // JSON for chart data
}
