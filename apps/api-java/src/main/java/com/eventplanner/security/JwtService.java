package com.eventplanner.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.JWTClaimsSet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final byte[] secret;

    public JwtService(@Value("${security.jwt.secret:dev-secret-change-me-please-dev-secret-change-me-please}") String secret) {
        // Ensure at least 256-bit key for HS256
        if (secret.length() < 32) {
            secret = String.format("%1$-32s", secret).replace(' ', 'x');
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(String subject, long expiresInSeconds, Map<String, Object> claims) {
        try {
            Instant now = Instant.now();
            JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder()
                    .subject(subject)
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(now.plusSeconds(expiresInSeconds)));
            if (claims != null) {
                claims.forEach(builder::claim);
            }
            JWTClaimsSet claimSet = builder.build();

            SignedJWT signedJWT = new SignedJWT(
                    new com.nimbusds.jose.JWSHeader(JWSAlgorithm.HS256),
                    claimSet
            );
            signedJWT.sign(new MACSigner(secret));
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Failed to generate JWT", e);
        }
    }

    public boolean validate(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            boolean verified = jwt.verify(new MACVerifier(secret));
            Date exp = jwt.getJWTClaimsSet().getExpirationTime();
            return verified && exp != null && exp.after(new Date());
        } catch (ParseException | JOSEException e) {
            return false;
        }
    }

    public JWTClaimsSet parseClaims(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            return jwt.getJWTClaimsSet();
        } catch (ParseException e) {
            throw new RuntimeException("Invalid JWT", e);
        }
    }
}
