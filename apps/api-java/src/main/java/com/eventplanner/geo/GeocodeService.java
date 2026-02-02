package com.eventplanner.geo;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeocodeService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    // Optional config (application.properties or env)
    // e.g. eventplanner.nominatim.userAgent=EventPlanner/1.0 (contact: support@example.com)
    // e.g. eventplanner.nominatim.countryCodes=IN
    @Value("${eventplanner.nominatim.userAgent:EventPlanner/1.0 (contact: support@example.com)}")
    private String nominatimUserAgent;

    @Value("${eventplanner.nominatim.countryCodes:}")
    private String nominatimCountryCodes;

    @Cacheable(value = "geocodeCity", key = "#city != null ? #city.toLowerCase() : 'null'", unless = "#result == null")
    public GeocodeResponse geocodeCity(String city) {
        if (city == null || city.isBlank()) return null;

        // Build query with optional country bias
        StringBuilder url = new StringBuilder("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=")
                .append(java.net.URLEncoder.encode(city, StandardCharsets.UTF_8));
        if (nominatimCountryCodes != null && !nominatimCountryCodes.isBlank()) {
            url.append("&countrycodes=").append(java.net.URLEncoder.encode(nominatimCountryCodes, StandardCharsets.UTF_8));
        }

        // Retry with backoff for 429/5xx
        int attempts = 0;
        int maxAttempts = 3;
        long[] backoffMs = new long[]{250, 750, 1500};
        Exception lastError = null;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(url.toString()))
                        .timeout(Duration.ofSeconds(8))
                        .header(HttpHeaders.USER_AGENT, nominatimUserAgent)
                        .header(HttpHeaders.ACCEPT_LANGUAGE, "en")
                        .GET()
                        .build();

                HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                int code = resp.statusCode();
                if (code >= 200 && code < 300) {
                    List<Map<String, Object>> arr = objectMapper.readValue(resp.body(), new TypeReference<>(){});
                    if (!arr.isEmpty()) {
                        Map<String, Object> first = arr.get(0);
                        Double lat = first.get("lat") != null ? Double.valueOf(first.get("lat").toString()) : null;
                        Double lon = first.get("lon") != null ? Double.valueOf(first.get("lon").toString()) : null;
                        if (lat != null && lon != null) {
                            return GeocodeResponse.builder().city(city).lat(lat).lon(lon).build();
                        }
                    }
                    // No results
                    return null;
                }

                // Retry on 429/5xx
                if (code == 429 || (code >= 500 && code < 600)) {
                    if (attempts < maxAttempts) {
                        long sleep = backoffMs[Math.min(attempts - 1, backoffMs.length - 1)];
                        log.warn("Nominatim {} for city '{}', retrying in {}ms (attempt {}/{})", code, city, sleep, attempts, maxAttempts);
                        try { Thread.sleep(sleep); } catch (InterruptedException ignored) {}
                        continue;
                    }
                } else {
                    // Non-retriable
                    String body = resp.body();
                    log.warn("Nominatim error {} for city '{}': {}", code, city, body != null ? body.substring(0, Math.min(200, body.length())) : "");
                }
            } catch (Exception e) {
                lastError = e;
                if (attempts < maxAttempts) {
                    long sleep = backoffMs[Math.min(attempts - 1, backoffMs.length - 1)];
                    log.warn("Geocoding attempt {}/{} failed for '{}': {}. Retrying in {}ms", attempts, maxAttempts, city, e.toString(), sleep);
                    try { Thread.sleep(sleep); } catch (InterruptedException ignored) {}
                    continue;
                }
            }
            break;
        }

        if (lastError != null) {
            log.warn("Geocoding failed for city '{}': {}", city, lastError.toString());
        }
        return null;
    }
}
