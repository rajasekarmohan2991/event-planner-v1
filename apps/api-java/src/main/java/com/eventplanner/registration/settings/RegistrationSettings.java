package com.eventplanner.registration.settings;

import com.eventplanner.events.Event;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "registration_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegistrationSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false, unique = true)
    private Event event;

    // Approval Settings
    @Column(name = "require_approval", nullable = false)
    @Builder.Default
    private Boolean requireApproval = false;

    @Column(name = "auto_approve_free_registrations", nullable = false)
    @Builder.Default
    private Boolean autoApproveFreeRegistrations = true;

    @Column(name = "require_approval_reason", nullable = false)
    @Builder.Default
    private Boolean requireApprovalReason = false;

    // Email Settings
    @Column(name = "send_confirmation_emails", nullable = false)
    @Builder.Default
    private Boolean sendConfirmationEmails = true;

    @Column(name = "send_reminder_emails", nullable = false)
    @Builder.Default
    private Boolean sendReminderEmails = false;

    @Column(name = "reminder_days_before", nullable = false)
    @Builder.Default
    private Integer reminderDaysBefore = 1;

    @Column(name = "send_approval_notifications", nullable = false)
    @Builder.Default
    private Boolean sendApprovalNotifications = true;

    @Column(name = "send_rejection_notifications", nullable = false)
    @Builder.Default
    private Boolean sendRejectionNotifications = true;

    // Export & Data Settings
    @Column(name = "allow_data_export", nullable = false)
    @Builder.Default
    private Boolean allowDataExport = true;

    @Column(name = "export_includes_personal_data", nullable = false)
    @Builder.Default
    private Boolean exportIncludesPersonalData = false;

    @Column(name = "require_export_approval", nullable = false)
    @Builder.Default
    private Boolean requireExportApproval = false;

    @Column(name = "data_retention_days", nullable = false)
    @Builder.Default
    private Integer dataRetentionDays = 365;

    // Registration Flow Settings
    @Column(name = "allow_waitlist", nullable = false)
    @Builder.Default
    private Boolean allowWaitlist = true;

    @Column(name = "max_waitlist_size", nullable = false)
    @Builder.Default
    private Integer maxWaitlistSize = 100;

    @Column(name = "show_remaining_spots", nullable = false)
    @Builder.Default
    private Boolean showRemainingSpots = true;

    @Column(name = "allow_registration_editing", nullable = false)
    @Builder.Default
    private Boolean allowRegistrationEditing = true;

    @Column(name = "registration_deadline_enforced", nullable = false)
    @Builder.Default
    private Boolean registrationDeadlineEnforced = false;

    // Security Settings
    @Column(name = "require_captcha", nullable = false)
    @Builder.Default
    private Boolean requireCaptcha = false;

    @Column(name = "max_registrations_per_ip", nullable = false)
    @Builder.Default
    private Integer maxRegistrationsPerIp = 10;

    @Column(name = "registration_rate_limit_minutes", nullable = false)
    @Builder.Default
    private Integer registrationRateLimitMinutes = 15;

    // Integration Settings
    @Column(name = "webhook_url")
    private String webhookUrl;

    @Column(name = "webhook_events")
    private String webhookEvents; // JSON array of events to send

    @Column(name = "enable_analytics_tracking", nullable = false)
    @Builder.Default
    private Boolean enableAnalyticsTracking = false;

    @Column(name = "google_analytics_id")
    private String googleAnalyticsId;

    @Column(name = "facebook_pixel_id")
    private String facebookPixelId;

    // Timestamps
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate public void preUpdate() { this.updatedAt = OffsetDateTime.now(); }

    // Explicit accessors to ensure compilation if Lombok annotation processing is unavailable
    public Long getId() { return this.id; }
    public void setId(Long id) { this.id = id; }
    public Event getEvent() { return this.event; }
    public void setEvent(Event event) { this.event = event; }

    public Boolean getRequireApproval() { return this.requireApproval; }
    public void setRequireApproval(Boolean requireApproval) { this.requireApproval = requireApproval; }
    public Boolean getAutoApproveFreeRegistrations() { return this.autoApproveFreeRegistrations; }
    public void setAutoApproveFreeRegistrations(Boolean autoApproveFreeRegistrations) { this.autoApproveFreeRegistrations = autoApproveFreeRegistrations; }
    public Boolean getRequireApprovalReason() { return this.requireApprovalReason; }
    public void setRequireApprovalReason(Boolean requireApprovalReason) { this.requireApprovalReason = requireApprovalReason; }

    public Boolean getSendConfirmationEmails() { return this.sendConfirmationEmails; }
    public void setSendConfirmationEmails(Boolean sendConfirmationEmails) { this.sendConfirmationEmails = sendConfirmationEmails; }
    public Boolean getSendReminderEmails() { return this.sendReminderEmails; }
    public void setSendReminderEmails(Boolean sendReminderEmails) { this.sendReminderEmails = sendReminderEmails; }
    public Integer getReminderDaysBefore() { return this.reminderDaysBefore; }
    public void setReminderDaysBefore(Integer reminderDaysBefore) { this.reminderDaysBefore = reminderDaysBefore; }
    public Boolean getSendApprovalNotifications() { return this.sendApprovalNotifications; }
    public void setSendApprovalNotifications(Boolean sendApprovalNotifications) { this.sendApprovalNotifications = sendApprovalNotifications; }
    public Boolean getSendRejectionNotifications() { return this.sendRejectionNotifications; }
    public void setSendRejectionNotifications(Boolean sendRejectionNotifications) { this.sendRejectionNotifications = sendRejectionNotifications; }

    public Boolean getAllowDataExport() { return this.allowDataExport; }
    public void setAllowDataExport(Boolean allowDataExport) { this.allowDataExport = allowDataExport; }
    public Boolean getExportIncludesPersonalData() { return this.exportIncludesPersonalData; }
    public void setExportIncludesPersonalData(Boolean exportIncludesPersonalData) { this.exportIncludesPersonalData = exportIncludesPersonalData; }
    public Boolean getRequireExportApproval() { return this.requireExportApproval; }
    public void setRequireExportApproval(Boolean requireExportApproval) { this.requireExportApproval = requireExportApproval; }
    public Integer getDataRetentionDays() { return this.dataRetentionDays; }
    public void setDataRetentionDays(Integer dataRetentionDays) { this.dataRetentionDays = dataRetentionDays; }

    public Boolean getAllowWaitlist() { return this.allowWaitlist; }
    public void setAllowWaitlist(Boolean allowWaitlist) { this.allowWaitlist = allowWaitlist; }
    public Integer getMaxWaitlistSize() { return this.maxWaitlistSize; }
    public void setMaxWaitlistSize(Integer maxWaitlistSize) { this.maxWaitlistSize = maxWaitlistSize; }
    public Boolean getShowRemainingSpots() { return this.showRemainingSpots; }
    public void setShowRemainingSpots(Boolean showRemainingSpots) { this.showRemainingSpots = showRemainingSpots; }
    public Boolean getAllowRegistrationEditing() { return this.allowRegistrationEditing; }
    public void setAllowRegistrationEditing(Boolean allowRegistrationEditing) { this.allowRegistrationEditing = allowRegistrationEditing; }
    public Boolean getRegistrationDeadlineEnforced() { return this.registrationDeadlineEnforced; }
    public void setRegistrationDeadlineEnforced(Boolean registrationDeadlineEnforced) { this.registrationDeadlineEnforced = registrationDeadlineEnforced; }

    public Boolean getRequireCaptcha() { return this.requireCaptcha; }
    public void setRequireCaptcha(Boolean requireCaptcha) { this.requireCaptcha = requireCaptcha; }
    public Integer getMaxRegistrationsPerIp() { return this.maxRegistrationsPerIp; }
    public void setMaxRegistrationsPerIp(Integer maxRegistrationsPerIp) { this.maxRegistrationsPerIp = maxRegistrationsPerIp; }
    public Integer getRegistrationRateLimitMinutes() { return this.registrationRateLimitMinutes; }
    public void setRegistrationRateLimitMinutes(Integer registrationRateLimitMinutes) { this.registrationRateLimitMinutes = registrationRateLimitMinutes; }

    public String getWebhookUrl() { return this.webhookUrl; }
    public void setWebhookUrl(String webhookUrl) { this.webhookUrl = webhookUrl; }
    public String getWebhookEvents() { return this.webhookEvents; }
    public void setWebhookEvents(String webhookEvents) { this.webhookEvents = webhookEvents; }
    public Boolean getEnableAnalyticsTracking() { return this.enableAnalyticsTracking; }
    public void setEnableAnalyticsTracking(Boolean enableAnalyticsTracking) { this.enableAnalyticsTracking = enableAnalyticsTracking; }
    public String getGoogleAnalyticsId() { return this.googleAnalyticsId; }
    public void setGoogleAnalyticsId(String googleAnalyticsId) { this.googleAnalyticsId = googleAnalyticsId; }
    public String getFacebookPixelId() { return this.facebookPixelId; }
    public void setFacebookPixelId(String facebookPixelId) { this.facebookPixelId = facebookPixelId; }

    public OffsetDateTime getCreatedAt() { return this.createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return this.updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
