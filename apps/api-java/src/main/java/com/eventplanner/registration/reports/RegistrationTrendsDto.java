package com.eventplanner.registration.reports;

public class RegistrationTrendsDto {
    public String dailyRegistrations; // JSON array for time series
    public String revenueTrend; // JSON array for revenue over time
    public String conversionTrend; // JSON array for conversion rates
    public String topHours; // JSON for registration volume by hour
    public String topDays; // JSON for registration volume by day of week
}
