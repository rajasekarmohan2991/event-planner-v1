package com.eventplanner.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;

@Component
public class AdminPasswordInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    @Value("${ADMIN_EMAIL:admin@eventplanner.com}")
    private String adminEmail;

    public AdminPasswordInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (adminPassword == null || adminPassword.isBlank()) {
            return; // nothing to do
        }
        Optional<User> userOpt = userRepository.findByEmail(adminEmail);
        if (userOpt.isPresent()) {
            User admin = userOpt.get();
            if (!passwordEncoder.matches(adminPassword, admin.getPasswordHash())) {
                admin.setPasswordHash(passwordEncoder.encode(adminPassword));
                admin.setUpdatedAt(Instant.now());
                userRepository.save(admin);
            }
        } else {
            // Create the admin user if it doesn't exist
            Instant now = Instant.now();
            User admin = User.builder()
                    .email(adminEmail)
                    .name("Admin")
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .gender(Gender.OTHER)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            userRepository.save(admin);
        }
    }
}
