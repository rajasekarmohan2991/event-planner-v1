package com.eventplanner.registration.settings;

import java.time.OffsetDateTime;

public class RegistrationSettingsDto {
    public Long id;
    public Long eventId;

    // Approval Settings
    public Boolean requireApproval;
    public Boolean autoApproveFreeRegistrations;
    public Boolean requireApprovalReason;

    // Email Settings
    public Boolean sendConfirmationEmails;
    public Boolean sendReminderEmails;
    public Integer reminderDaysBefore;
    public Boolean sendApprovalNotifications;
    public Boolean sendRejectionNotifications;

    // Export & Data Settings
    public Boolean allowDataExport;
    public Boolean exportIncludesPersonalData;
    public Boolean requireExportApproval;
    public Integer dataRetentionDays;

    // Registration Flow Settings
    public Boolean allowWaitlist;
    public Integer maxWaitlistSize;
    public Boolean showRemainingSpots;
    public Boolean allowRegistrationEditing;
    public Boolean registrationDeadlineEnforced;

    // Security Settings
    public Boolean requireCaptcha;
    public Integer maxRegistrationsPerIp;
    public Integer registrationRateLimitMinutes;

    // Integration Settings
    public String webhookUrl;
    public String webhookEvents;
    public Boolean enableAnalyticsTracking;
    public String googleAnalyticsId;
    public String facebookPixelId;

    // Timestamps
    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
