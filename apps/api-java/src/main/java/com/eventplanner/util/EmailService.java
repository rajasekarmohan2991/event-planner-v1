package com.eventplanner.util;

public interface EmailService {
    void sendInviteEmail(String toEmail, String name, String role, Long eventId);
}
