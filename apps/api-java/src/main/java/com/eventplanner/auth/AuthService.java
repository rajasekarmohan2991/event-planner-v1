package com.eventplanner.auth;

import com.eventplanner.auth.dto.*;
import com.eventplanner.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final Optional<RedisTemplate<String, Object>> redisTemplateOpt;

    private static final long ACCESS_TOKEN_TTL = 60L * 60L * 24L; // 24h
    private static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(30);

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        Instant now = Instant.now();
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .gender(request.getGender() != null ? request.getGender() : Gender.OTHER)
                .createdAt(now)
                .updatedAt(now)
                .build();
        userRepository.save(user);

        String token = jwtService.generateToken(
                user.getEmail(),
                ACCESS_TOKEN_TTL,
                Map.of("role", user.getRole().name(), "uid", user.getId())
        );
        UserDto dto = UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .gender(user.getGender())
                .build();
        return new AuthResponse(token, "Bearer", dto);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        String token = jwtService.generateToken(
                user.getEmail(),
                ACCESS_TOKEN_TTL,
                Map.of("role", user.getRole().name(), "uid", user.getId())
        );
        UserDto dto = UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .gender(user.getGender())
                .build();
        return new AuthResponse(token, "Bearer", dto);
    }

    public String initiatePasswordReset(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            // Do not reveal whether email exists
            return "If the email exists, a reset link has been sent.";
        }
        String token = UUID.randomUUID().toString().replace("-", "");
        String key = resetKey(token);
        redisTemplateOpt.ifPresent(rt -> rt.opsForValue().set(key, request.getEmail(), RESET_TOKEN_TTL));
        return token;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String key = resetKey(request.getToken());
        Object emailObj = redisTemplateOpt.map(rt -> rt.opsForValue().get(key)).orElse(null);
        if (emailObj == null) {
            throw new RuntimeException("Invalid or expired token");
        }
        String email = emailObj.toString();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        redisTemplateOpt.ifPresent(rt -> rt.delete(key));
    }

    private String resetKey(String token) {
        return "pwdreset:" + token;
    }
}
