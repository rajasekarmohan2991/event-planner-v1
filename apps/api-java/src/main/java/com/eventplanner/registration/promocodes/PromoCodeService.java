package com.eventplanner.registration.promocodes;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class PromoCodeService {
    private final PromoCodeRepository repo;
    private final EventRepository events;
    private final ObjectMapper objectMapper;

    public PromoCodeService(PromoCodeRepository repo, EventRepository events, ObjectMapper objectMapper) {
        this.repo = repo;
        this.events = events;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<PromoCodeDto> listByEvent(Long eventId) {
        events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        return repo.findByEventIdAndIsActiveTrueOrderByCreatedAtDesc(eventId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PromoCodeDto get(Long promoCodeId) {
        PromoCode pc = repo.findById(promoCodeId).orElseThrow(() -> new NoSuchElementException("Promo code not found"));
        return toDto(pc);
    }

    @Transactional
    public PromoCodeDto create(Long eventId, PromoCodeDto dto) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));

        // Check if code already exists
        if (repo.findByCodeAndIsActiveTrue(dto.code).isPresent()) {
            throw new IllegalArgumentException("Promo code already exists");
        }

        PromoCode pc = PromoCode.builder()
                .event(e)
                .code(dto.code.toUpperCase())
                .discountType(dto.discountType != null ? dto.discountType : "PERCENT")
                .discountAmount(dto.discountAmount)
                .maxUses(dto.maxUses != null ? dto.maxUses : -1)
                .usedCount(0)
                .maxUsesPerUser(dto.maxUsesPerUser != null ? dto.maxUsesPerUser : 1)
                .minOrderAmount(dto.minOrderAmount != null ? dto.minOrderAmount : 0)
                .applicableTicketIds(dto.applicableTicketIds)
                .startDate(dto.startDate)
                .endDate(dto.endDate)
                .isActive(dto.isActive != null ? dto.isActive : true)
                .description(dto.description)
                .build();

        PromoCode saved = repo.save(pc);
        return toDto(saved);
    }

    @Transactional
    public PromoCodeDto update(Long eventId, Long promoCodeId, PromoCodeDto dto) {
        events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        PromoCode pc = repo.findByIdAndEventId(promoCodeId, eventId)
                .orElseThrow(() -> new NoSuchElementException("Promo code not found"));

        if (dto.code != null) {
            // Check if new code conflicts with existing codes
            repo.findByCodeAndIsActiveTrue(dto.code).ifPresent(existing -> {
                if (!existing.getId().equals(promoCodeId)) {
                    throw new IllegalArgumentException("Promo code already exists");
                }
            });
            pc.setCode(dto.code.toUpperCase());
        }

        if (dto.discountType != null) pc.setDiscountType(dto.discountType);
        if (dto.discountAmount != null) pc.setDiscountAmount(dto.discountAmount);
        if (dto.maxUses != null) pc.setMaxUses(dto.maxUses);
        if (dto.maxUsesPerUser != null) pc.setMaxUsesPerUser(dto.maxUsesPerUser);
        if (dto.minOrderAmount != null) pc.setMinOrderAmount(dto.minOrderAmount);
        if (dto.applicableTicketIds != null) pc.setApplicableTicketIds(dto.applicableTicketIds);
        if (dto.startDate != null) pc.setStartDate(dto.startDate);
        if (dto.endDate != null) pc.setEndDate(dto.endDate);
        if (dto.isActive != null) pc.setIsActive(dto.isActive);
        if (dto.description != null) pc.setDescription(dto.description);

        return toDto(repo.save(pc));
    }

    @Transactional
    public void delete(Long eventId, Long promoCodeId) {
        PromoCode pc = repo.findByIdAndEventId(promoCodeId, eventId)
                .orElseThrow(() -> new NoSuchElementException("Promo code not found"));
        repo.delete(pc);
    }

    @Transactional(readOnly = true)
    public PromoCodeValidationResult validatePromoCode(String code, Long eventId, Long ticketId, Integer orderAmount) {
        PromoCode pc = repo.findByCodeAndIsActiveTrue(code).orElse(null);

        if (pc == null) {
            return PromoCodeValidationResult.invalid("Promo code not found");
        }

        if (!pc.getEvent().getId().equals(eventId)) {
            return PromoCodeValidationResult.invalid("Promo code not valid for this event");
        }

        if (!pc.getIsActive()) {
            return PromoCodeValidationResult.invalid("Promo code is not active");
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (pc.getStartDate() != null && now.isBefore(pc.getStartDate())) {
            return PromoCodeValidationResult.invalid("Promo code not yet valid");
        }

        if (pc.getEndDate() != null && now.isAfter(pc.getEndDate())) {
            return PromoCodeValidationResult.invalid("Promo code has expired");
        }

        if (pc.getMaxUses() != -1 && pc.getUsedCount() >= pc.getMaxUses()) {
            return PromoCodeValidationResult.invalid("Promo code usage limit exceeded");
        }

        if (orderAmount != null && orderAmount < pc.getMinOrderAmount()) {
            return PromoCodeValidationResult.invalid("Order amount below minimum required");
        }

        // Check if promo code is applicable to specific tickets
        if (pc.getApplicableTicketIds() != null && ticketId != null) {
            try {
                List<Long> applicableTicketIds = objectMapper.readValue(pc.getApplicableTicketIds(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Long.class));
                if (!applicableTicketIds.contains(ticketId)) {
                    return PromoCodeValidationResult.invalid("Promo code not applicable to this ticket");
                }
            } catch (Exception e) {
                return PromoCodeValidationResult.invalid("Error validating promo code applicability");
            }
        }

        // Calculate discount
        // Guard against nulls in discount inputs
        int safeOrderAmount = orderAmount != null ? orderAmount : 0;
        Integer pcDiscount = pc.getDiscountAmount();
        int safeDiscount = pcDiscount != null ? pcDiscount : 0;

        Integer discountAmount = 0;
        if ("PERCENT".equals(pc.getDiscountType())) {
            discountAmount = (safeOrderAmount * safeDiscount) / 100;
        } else if ("FIXED".equals(pc.getDiscountType())) {
            discountAmount = Math.min(safeDiscount, safeOrderAmount);
        }

        return PromoCodeValidationResult.valid(pc.getId(), pc.getCode(), pc.getDiscountType(),
            pc.getDiscountAmount(), discountAmount, pc.getDescription());
    }

    @Transactional
    public void incrementUsage(Long promoCodeId) {
        PromoCode pc = repo.findById(promoCodeId).orElseThrow();
        pc.setUsedCount(pc.getUsedCount() + 1);
        repo.save(pc);
    }

    private PromoCodeDto toDto(PromoCode pc) {
        PromoCodeDto d = new PromoCodeDto();
        d.id = pc.getId();
        d.eventId = pc.getEvent().getId();
        d.code = pc.getCode();
        d.discountType = pc.getDiscountType();
        d.discountAmount = pc.getDiscountAmount();
        d.maxUses = pc.getMaxUses();
        d.usedCount = pc.getUsedCount();
        d.maxUsesPerUser = pc.getMaxUsesPerUser();
        d.minOrderAmount = pc.getMinOrderAmount();
        d.applicableTicketIds = pc.getApplicableTicketIds();
        d.startDate = pc.getStartDate();
        d.endDate = pc.getEndDate();
        d.isActive = pc.getIsActive();
        d.description = pc.getDescription();
        d.createdAt = pc.getCreatedAt();
        return d;
    }

    public static class PromoCodeValidationResult {
        private final boolean valid;
        private final String errorMessage;
        private final Long promoCodeId;
        private final String code;
        private final String discountType;
        private final Integer discountAmount;
        private final Integer calculatedDiscount;
        private final String description;

        private PromoCodeValidationResult(boolean valid, String errorMessage, Long promoCodeId, String code,
                                         String discountType, Integer discountAmount, Integer calculatedDiscount, String description) {
            this.valid = valid;
            this.errorMessage = errorMessage;
            this.promoCodeId = promoCodeId;
            this.code = code;
            this.discountType = discountType;
            this.discountAmount = discountAmount;
            this.calculatedDiscount = calculatedDiscount;
            this.description = description;
        }

        public static PromoCodeValidationResult invalid(String errorMessage) {
            return new PromoCodeValidationResult(false, errorMessage, null, null, null, null, null, null);
        }

        public static PromoCodeValidationResult valid(Long promoCodeId, String code, String discountType,
                                                     Integer discountAmount, Integer calculatedDiscount, String description) {
            return new PromoCodeValidationResult(true, null, promoCodeId, code, discountType, discountAmount, calculatedDiscount, description);
        }

        public boolean isValid() { return valid; }
        public String getErrorMessage() { return errorMessage; }
        public Long getPromoCodeId() { return promoCodeId; }
        public String getCode() { return code; }
        public String getDiscountType() { return discountType; }
        public Integer getDiscountAmount() { return discountAmount; }
        public Integer getCalculatedDiscount() { return calculatedDiscount; }
        public String getDescription() { return description; }
    }
}
