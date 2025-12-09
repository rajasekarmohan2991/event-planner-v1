package com.eventplanner.registration.settings;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
public class RegistrationSettingsService {
    private final RegistrationSettingsRepository repo;
    private final EventRepository events;

    public RegistrationSettingsService(RegistrationSettingsRepository repo, EventRepository events) {
        this.repo = repo;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public RegistrationSettingsDto getByEvent(Long eventId) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        RegistrationSettings settings = repo.findByEventId(eventId).orElse(createDefaultSettings(e));
        return toDto(settings);
    }

    @Transactional
    public RegistrationSettingsDto update(Long eventId, RegistrationSettingsDto dto) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));

        RegistrationSettings settings = repo.findByEventId(eventId).orElse(createDefaultSettings(e));

        // Update all fields from DTO
        if (dto.requireApproval != null) settings.setRequireApproval(dto.requireApproval);
        if (dto.autoApproveFreeRegistrations != null) settings.setAutoApproveFreeRegistrations(dto.autoApproveFreeRegistrations);
        if (dto.requireApprovalReason != null) settings.setRequireApprovalReason(dto.requireApprovalReason);

        if (dto.sendConfirmationEmails != null) settings.setSendConfirmationEmails(dto.sendConfirmationEmails);
        if (dto.sendReminderEmails != null) settings.setSendReminderEmails(dto.sendReminderEmails);
        if (dto.reminderDaysBefore != null) settings.setReminderDaysBefore(dto.reminderDaysBefore);
        if (dto.sendApprovalNotifications != null) settings.setSendApprovalNotifications(dto.sendApprovalNotifications);
        if (dto.sendRejectionNotifications != null) settings.setSendRejectionNotifications(dto.sendRejectionNotifications);

        if (dto.allowDataExport != null) settings.setAllowDataExport(dto.allowDataExport);
        if (dto.exportIncludesPersonalData != null) settings.setExportIncludesPersonalData(dto.exportIncludesPersonalData);
        if (dto.requireExportApproval != null) settings.setRequireExportApproval(dto.requireExportApproval);
        if (dto.dataRetentionDays != null) settings.setDataRetentionDays(dto.dataRetentionDays);

        if (dto.allowWaitlist != null) settings.setAllowWaitlist(dto.allowWaitlist);
        if (dto.maxWaitlistSize != null) settings.setMaxWaitlistSize(dto.maxWaitlistSize);
        if (dto.showRemainingSpots != null) settings.setShowRemainingSpots(dto.showRemainingSpots);
        if (dto.allowRegistrationEditing != null) settings.setAllowRegistrationEditing(dto.allowRegistrationEditing);
        if (dto.registrationDeadlineEnforced != null) settings.setRegistrationDeadlineEnforced(dto.registrationDeadlineEnforced);

        if (dto.requireCaptcha != null) settings.setRequireCaptcha(dto.requireCaptcha);
        if (dto.maxRegistrationsPerIp != null) settings.setMaxRegistrationsPerIp(dto.maxRegistrationsPerIp);
        if (dto.registrationRateLimitMinutes != null) settings.setRegistrationRateLimitMinutes(dto.registrationRateLimitMinutes);

        if (dto.webhookUrl != null) settings.setWebhookUrl(dto.webhookUrl);
        if (dto.webhookEvents != null) settings.setWebhookEvents(dto.webhookEvents);
        if (dto.enableAnalyticsTracking != null) settings.setEnableAnalyticsTracking(dto.enableAnalyticsTracking);
        if (dto.googleAnalyticsId != null) settings.setGoogleAnalyticsId(dto.googleAnalyticsId);
        if (dto.facebookPixelId != null) settings.setFacebookPixelId(dto.facebookPixelId);

        RegistrationSettings saved = repo.save(settings);
        return toDto(saved);
    }

    private RegistrationSettings createDefaultSettings(Event event) {
        RegistrationSettings settings = RegistrationSettings.builder()
                .event(event)
                .requireApproval(false)
                .autoApproveFreeRegistrations(true)
                .requireApprovalReason(false)
                .sendConfirmationEmails(true)
                .sendReminderEmails(false)
                .reminderDaysBefore(1)
                .sendApprovalNotifications(true)
                .sendRejectionNotifications(true)
                .allowDataExport(true)
                .exportIncludesPersonalData(false)
                .requireExportApproval(false)
                .dataRetentionDays(365)
                .allowWaitlist(true)
                .maxWaitlistSize(100)
                .showRemainingSpots(true)
                .allowRegistrationEditing(true)
                .registrationDeadlineEnforced(false)
                .requireCaptcha(false)
                .maxRegistrationsPerIp(10)
                .registrationRateLimitMinutes(15)
                .enableAnalyticsTracking(false)
                .build();

        return repo.save(settings);
    }

    private RegistrationSettingsDto toDto(RegistrationSettings settings) {
        RegistrationSettingsDto dto = new RegistrationSettingsDto();
        dto.id = settings.getId();
        dto.eventId = settings.getEvent().getId();

        // Approval Settings
        dto.requireApproval = settings.getRequireApproval();
        dto.autoApproveFreeRegistrations = settings.getAutoApproveFreeRegistrations();
        dto.requireApprovalReason = settings.getRequireApprovalReason();

        // Email Settings
        dto.sendConfirmationEmails = settings.getSendConfirmationEmails();
        dto.sendReminderEmails = settings.getSendReminderEmails();
        dto.reminderDaysBefore = settings.getReminderDaysBefore();
        dto.sendApprovalNotifications = settings.getSendApprovalNotifications();
        dto.sendRejectionNotifications = settings.getSendRejectionNotifications();

        // Export & Data Settings
        dto.allowDataExport = settings.getAllowDataExport();
        dto.exportIncludesPersonalData = settings.getExportIncludesPersonalData();
        dto.requireExportApproval = settings.getRequireExportApproval();
        dto.dataRetentionDays = settings.getDataRetentionDays();

        // Registration Flow Settings
        dto.allowWaitlist = settings.getAllowWaitlist();
        dto.maxWaitlistSize = settings.getMaxWaitlistSize();
        dto.showRemainingSpots = settings.getShowRemainingSpots();
        dto.allowRegistrationEditing = settings.getAllowRegistrationEditing();
        dto.registrationDeadlineEnforced = settings.getRegistrationDeadlineEnforced();

        // Security Settings
        dto.requireCaptcha = settings.getRequireCaptcha();
        dto.maxRegistrationsPerIp = settings.getMaxRegistrationsPerIp();
        dto.registrationRateLimitMinutes = settings.getRegistrationRateLimitMinutes();

        // Integration Settings
        dto.webhookUrl = settings.getWebhookUrl();
        dto.webhookEvents = settings.getWebhookEvents();
        dto.enableAnalyticsTracking = settings.getEnableAnalyticsTracking();
        dto.googleAnalyticsId = settings.getGoogleAnalyticsId();
        dto.facebookPixelId = settings.getFacebookPixelId();

        // Timestamps
        dto.createdAt = settings.getCreatedAt();
        dto.updatedAt = settings.getUpdatedAt();

        return dto;
    }
}
