package com.eventplanner.registration.reports;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import com.eventplanner.registration.payments.Payment;
import com.eventplanner.registration.payments.PaymentRepository;
import com.eventplanner.registration.promocodes.PromoCode;
import com.eventplanner.registration.promocodes.PromoCodeRepository;
import com.eventplanner.registration.tickets.Ticket;
import com.eventplanner.registration.tickets.TicketRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RegistrationReportsService {
    private final TicketRepository ticketRepo;
    private final PaymentRepository paymentRepo;
    private final PromoCodeRepository promoCodeRepo;
    private final EventRepository eventRepo;
    private final ObjectMapper objectMapper;

    public RegistrationReportsService(
            TicketRepository ticketRepo,
            PaymentRepository paymentRepo,
            PromoCodeRepository promoCodeRepo,
            EventRepository eventRepo,
            ObjectMapper objectMapper) {
        this.ticketRepo = ticketRepo;
        this.paymentRepo = paymentRepo;
        this.promoCodeRepo = promoCodeRepo;
        this.eventRepo = eventRepo;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public RegistrationSummaryDto getRegistrationSummary(Long eventId) {
        Event event = eventRepo.findById(eventId).orElseThrow();

        List<Ticket> tickets = ticketRepo.findByEvent(event);
        List<Payment> payments = paymentRepo.findByEventIdOrderByCreatedAtDesc(eventId);

        // Calculate registration metrics
        long totalTicketsSold = tickets.stream().mapToLong(Ticket::getSold).sum();
        long totalTicketsAvailable = tickets.stream().mapToLong(Ticket::getQuantity).sum();
        double totalRevenue = payments.stream()
                .filter(p -> "SUCCEEDED".equals(p.getStatus()))
                .mapToDouble(p -> p.getAmountInMinor() / 100.0)
                .sum();
        double averageOrderValue = payments.stream()
                .filter(p -> "SUCCEEDED".equals(p.getStatus()))
                .mapToDouble(p -> p.getAmountInMinor() / 100.0)
                .average()
                .orElse(0.0);

        // Find top ticket type
        Ticket topTicket = tickets.stream()
                .max(Comparator.comparing(Ticket::getSold))
                .orElse(null);

        RegistrationSummaryDto summary = new RegistrationSummaryDto();
        summary.totalRegistrations = totalTicketsSold;
        summary.totalRevenue = totalRevenue;
        summary.averageOrderValue = averageOrderValue;
        summary.totalTicketsSold = totalTicketsSold;
        summary.totalTicketsAvailable = totalTicketsAvailable;
        summary.conversionRate = totalTicketsAvailable > 0 ?
                (double) totalTicketsSold / totalTicketsAvailable * 100 : 0.0;
        summary.uniqueAttendees = totalTicketsSold; // Simplified - in real app would be distinct users

        if (topTicket != null) {
            summary.topTicketType = topTicket.getName();
            summary.topTicketCount = topTicket.getSold() == null ? 0L : topTicket.getSold().longValue();
        }

        return summary;
    }

    @Transactional(readOnly = true)
    public List<TicketSalesDto> getTicketSalesReport(Long eventId) {
        Event event = eventRepo.findById(eventId).orElseThrow();
        List<Ticket> tickets = ticketRepo.findByEvent(event);

        return tickets.stream().map(ticket -> {
            TicketSalesDto dto = new TicketSalesDto();
            dto.ticketId = ticket.getId();
            dto.ticketName = ticket.getName();
            dto.ticketType = ticket.getGroupId() != null ? ticket.getGroupId() : "Standard";
            dto.priceInMinor = ticket.getPriceInMinor();
            dto.currency = ticket.getCurrency();
            dto.quantitySold = ticket.getSold() == null ? 0L : ticket.getSold().longValue();
            dto.quantityAvailable = ticket.getQuantity() == null ? 0L : ticket.getQuantity().longValue();
            dto.revenue = ticket.getSold() * (ticket.getPriceInMinor() / 100.0);
            dto.percentageSold = (ticket.getQuantity() != null && ticket.getQuantity() > 0) ?
                    (double) ticket.getSold() / ticket.getQuantity() * 100 : 0.0;
            dto.status = ticket.getStatus();
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentAnalyticsDto getPaymentAnalytics(Long eventId) {
        List<Payment> payments = paymentRepo.findByEventIdOrderByCreatedAtDesc(eventId);

        long totalPayments = payments.size();
        double totalRevenue = payments.stream()
                .filter(p -> "SUCCEEDED".equals(p.getStatus()))
                .mapToDouble(p -> p.getAmountInMinor() / 100.0)
                .sum();
        double averagePaymentAmount = payments.stream()
                .filter(p -> "SUCCEEDED".equals(p.getStatus()))
                .mapToDouble(p -> p.getAmountInMinor() / 100.0)
                .average()
                .orElse(0.0);

        long successfulPayments = payments.stream()
                .mapToLong(p -> "SUCCEEDED".equals(p.getStatus()) ? 1 : 0)
                .sum();
        long failedPayments = payments.stream()
                .mapToLong(p -> "FAILED".equals(p.getStatus()) ? 1 : 0)
                .sum();
        long pendingPayments = payments.stream()
                .mapToLong(p -> "PENDING".equals(p.getStatus()) ? 1 : 0)
                .sum();

        // Generate revenue by day data (last 30 days)
        Map<String, Double> dailyRevenue = new LinkedHashMap<>();
        OffsetDateTime thirtyDaysAgo = OffsetDateTime.now().minusDays(30);

        payments.stream()
                .filter(p -> "SUCCEEDED".equals(p.getStatus()) &&
                        p.getCreatedAt().isAfter(thirtyDaysAgo))
                .forEach(payment -> {
                    String day = payment.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    dailyRevenue.merge(day, payment.getAmountInMinor() / 100.0, Double::sum);
                });

        // Generate payments by status data
        Map<String, Long> statusCounts = payments.stream()
                .collect(Collectors.groupingBy(Payment::getStatus, Collectors.counting()));

        PaymentAnalyticsDto analytics = new PaymentAnalyticsDto();
        analytics.totalPayments = totalPayments;
        analytics.totalRevenue = totalRevenue;
        analytics.averagePaymentAmount = averagePaymentAmount;
        analytics.successfulPayments = successfulPayments;
        analytics.failedPayments = failedPayments;
        analytics.pendingPayments = pendingPayments;
        analytics.refundRate = 0.0; // Would need refunds table for this

        try {
            analytics.revenueByDay = objectMapper.writeValueAsString(dailyRevenue);
            analytics.paymentsByStatus = objectMapper.writeValueAsString(statusCounts);
        } catch (Exception e) {
            analytics.revenueByDay = "{}";
            analytics.paymentsByStatus = "{}";
        }

        return analytics;
    }

    @Transactional(readOnly = true)
    public PromoCodeAnalyticsDto getPromoCodeAnalytics(Long eventId) {
        List<PromoCode> promoCodes = promoCodeRepo.findByEventIdAndIsActiveTrueOrderByCreatedAtDesc(eventId);

        long totalPromoCodes = promoCodes.size();
        long activePromoCodes = promoCodes.stream()
                .mapToLong(p -> p.getIsActive() ? 1 : 0)
                .sum();
        long totalUses = promoCodes.stream().mapToLong(PromoCode::getUsedCount).sum();
        double totalDiscountAmount = 0.0; // Would need to calculate from payment data

        // Find most used promo code
        PromoCode mostUsed = promoCodes.stream()
                .max(Comparator.comparing(PromoCode::getUsedCount))
                .orElse(null);

        // Generate usage data for chart
        Map<String, Integer> promoUsage = promoCodes.stream()
                .collect(Collectors.toMap(
                    PromoCode::getCode,
                    PromoCode::getUsedCount,
                    Integer::sum
                ));

        PromoCodeAnalyticsDto analytics = new PromoCodeAnalyticsDto();
        analytics.totalPromoCodes = totalPromoCodes;
        analytics.activePromoCodes = activePromoCodes;
        analytics.totalUses = totalUses;
        analytics.totalDiscountAmount = totalDiscountAmount;
        analytics.averageDiscountAmount = totalUses > 0 ? totalDiscountAmount / totalUses : 0.0;

        if (mostUsed != null) {
            analytics.mostUsedPromoCode = mostUsed.getCode();
            analytics.mostUsedPromoCount = mostUsed.getUsedCount() == null ? 0L : mostUsed.getUsedCount().longValue();
        }

        try {
            analytics.promoCodeUsage = objectMapper.writeValueAsString(promoUsage);
        } catch (Exception e) {
            analytics.promoCodeUsage = "{}";
        }

        return analytics;
    }

    @Transactional(readOnly = true)
    public RegistrationTrendsDto getRegistrationTrends(Long eventId) {
        List<Payment> payments = paymentRepo.findByEventIdOrderByCreatedAtDesc(eventId);

        // Daily registrations (last 30 days)
        Map<String, Long> dailyRegistrations = new LinkedHashMap<>();
        OffsetDateTime thirtyDaysAgo = OffsetDateTime.now().minusDays(30);

        payments.stream()
                .filter(p -> p.getCreatedAt().isAfter(thirtyDaysAgo))
                .forEach(payment -> {
                    String day = payment.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    dailyRegistrations.merge(day, 1L, Long::sum);
                });

        // Revenue trend (daily)
        Map<String, Double> revenueTrend = new LinkedHashMap<>();
        payments.stream()
                .filter(p -> "SUCCEEDED".equals(p.getStatus()) &&
                        p.getCreatedAt().isAfter(thirtyDaysAgo))
                .forEach(payment -> {
                    String day = payment.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    revenueTrend.merge(day, payment.getAmountInMinor() / 100.0, Double::sum);
                });

        // Hourly distribution (last 7 days)
        Map<Integer, Long> hourlyDistribution = new LinkedHashMap<>();
        OffsetDateTime sevenDaysAgo = OffsetDateTime.now().minusDays(7);

        payments.stream()
                .filter(p -> p.getCreatedAt().isAfter(sevenDaysAgo))
                .forEach(payment -> {
                    int hour = payment.getCreatedAt().getHour();
                    hourlyDistribution.merge(hour, 1L, Long::sum);
                });

        // Daily distribution by day of week
        Map<String, Long> dailyDistribution = new LinkedHashMap<>();
        payments.forEach(payment -> {
            String dayOfWeek = payment.getCreatedAt().getDayOfWeek().toString();
            dailyDistribution.merge(dayOfWeek, 1L, Long::sum);
        });

        RegistrationTrendsDto trends = new RegistrationTrendsDto();

        try {
            trends.dailyRegistrations = objectMapper.writeValueAsString(dailyRegistrations);
            trends.revenueTrend = objectMapper.writeValueAsString(revenueTrend);
            trends.topHours = objectMapper.writeValueAsString(hourlyDistribution);
            trends.topDays = objectMapper.writeValueAsString(dailyDistribution);
            trends.conversionTrend = "{}"; // Would need more complex calculation
        } catch (Exception e) {
            trends.dailyRegistrations = "{}";
            trends.revenueTrend = "{}";
            trends.topHours = "{}";
            trends.topDays = "{}";
            trends.conversionTrend = "{}";
        }

        return trends;
    }
}
