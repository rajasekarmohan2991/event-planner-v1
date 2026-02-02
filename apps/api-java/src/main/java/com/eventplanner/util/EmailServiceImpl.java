package com.eventplanner.util;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;
    private final Environment environment;

    @Value("${app.mail.from:no-reply@eventplanner.local}")
    private String from;

    @Override
    public void sendInviteEmail(String toEmail, String name, String role, Long eventId) {
        // Skip if SMTP is not configured
        String host = environment.getProperty("spring.mail.host", "");
        if (host == null || host.isBlank()) {
            return; // no-op when mail is not configured
        }
        if (toEmail == null || toEmail.isBlank()) return;
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(toEmail);
            msg.setSubject("You're invited to collaborate on an event");
            String base = System.getenv().getOrDefault("APP_BASE_URL", "http://localhost:8081");
            String approveUrl = base + "/api/events/" + eventId + "/team/approve?email=" + toEmail;
            String rejectUrl = base + "/api/events/" + eventId + "/team/reject?email=" + toEmail;
            msg.setText("Hi " + (name == null ? "there" : name) + ",\n\n" +
                    "You have been invited as '" + role + "' to collaborate on Event #" + eventId + ".\n" +
                    "Approve your invite: " + approveUrl + "\n" +
                    "Reject this invite: " + rejectUrl + "\n\n" +
                    "Thanks,\nEvent Planner");
            mailSender.send(msg);
        } catch (Exception ignored) {
            // best-effort
        }
    }
}
