package com.eventplanner.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.HashSet;
import java.util.Set;

public final class PaginationUtils {
    private PaginationUtils() {}

    public static final int MAX_PAGE_SIZE = 100;

    public static int capSize(int requested) {
        if (requested <= 0) return 20;
        return Math.min(requested, MAX_PAGE_SIZE);
    }

    public static Sort safeSort(String sortParam, String defaultField, Set<String> allowedFields) {
        try {
            if (sortParam == null || sortParam.isBlank()) {
                return Sort.by(defaultField).ascending();
            }
            String[] parts = sortParam.split(",");
            String field = parts[0];
            String dir = parts.length > 1 ? parts[1] : "asc";
            if (!allowedFields.contains(field)) {
                field = defaultField;
            }
            Sort.Direction direction = "desc".equalsIgnoreCase(dir) ? Sort.Direction.DESC : Sort.Direction.ASC;
            return Sort.by(direction, field);
        } catch (Exception e) {
            return Sort.by(defaultField).ascending();
        }
    }

    public static Pageable pageable(int page, int size, Sort sort) {
        int safeSize = capSize(size);
        int safePage = Math.max(page, 0);
        return PageRequest.of(safePage, safeSize, sort);
    }

    public static Set<String> set(String... fields) {
        Set<String> s = new HashSet<>();
        for (String f : fields) s.add(f);
        return s;
    }
}
