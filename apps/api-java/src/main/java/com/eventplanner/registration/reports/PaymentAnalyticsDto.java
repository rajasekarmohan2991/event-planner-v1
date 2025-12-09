package com.eventplanner.registration.reports;

public class PaymentAnalyticsDto {
    public Long totalPayments;
    public Double totalRevenue;
    public Double averagePaymentAmount;
    public Long successfulPayments;
    public Long failedPayments;
    public Long pendingPayments;
    public String topPaymentMethod;
    public Double refundRate;
    public String revenueByDay; // JSON array for chart data
    public String paymentsByStatus; // JSON object for pie chart
}
