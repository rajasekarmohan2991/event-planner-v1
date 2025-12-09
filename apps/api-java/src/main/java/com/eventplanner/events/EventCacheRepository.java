package com.eventplanner.events;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Repository
public class EventCacheRepository {
    private static final String CACHE_KEY_PREFIX = "event:";
    private static final long CACHE_TTL_HOURS = 1;

    private final RedisTemplate<String, Event> redisTemplate;

    public EventCacheRepository(RedisTemplate<String, Event> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void cacheEvent(Event event) {
        if (event != null && event.getId() != null) {
            try {
                String key = CACHE_KEY_PREFIX + event.getId();
                redisTemplate.opsForValue().set(key, event, CACHE_TTL_HOURS, TimeUnit.HOURS);
            } catch (Exception e) {
                System.err.println("[EventCacheRepository] cacheEvent failed: " + e.getMessage());
            }
        }
    }

    public Optional<Event> getCachedEvent(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        try {
            String key = CACHE_KEY_PREFIX + id;
            Event event = redisTemplate.opsForValue().get(key);
            return Optional.ofNullable(event);
        } catch (Exception e) {
            System.err.println("[EventCacheRepository] getCachedEvent failed: " + e.getMessage());
            return Optional.empty();
        }
    }

    public void evictEventFromCache(Long id) {
        if (id != null) {
            try {
                String key = CACHE_KEY_PREFIX + id;
                redisTemplate.delete(key);
            } catch (Exception e) {
                System.err.println("[EventCacheRepository] evictEventFromCache failed: " + e.getMessage());
            }
        }
    }
}
