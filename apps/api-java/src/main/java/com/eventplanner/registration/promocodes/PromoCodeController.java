package com.eventplanner.registration.promocodes;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/promo-codes")
@CrossOrigin(
        origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true"
)
public class PromoCodeController {
    private final PromoCodeService service;

    public PromoCodeController(PromoCodeService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<PromoCodeDto>> list(@PathVariable("eventId") Long eventId) {
        return ResponseEntity.ok(service.listByEvent(eventId));
    }

    @GetMapping("/{promoCodeId}")
    public ResponseEntity<PromoCodeDto> get(@PathVariable("eventId") Long eventId, @PathVariable("promoCodeId") Long promoCodeId) {
        return ResponseEntity.ok(service.get(promoCodeId));
    }

    @PostMapping
    public ResponseEntity<PromoCodeDto> create(@PathVariable("eventId") Long eventId, @RequestBody PromoCodeDto dto) {
        return ResponseEntity.ok(service.create(eventId, dto));
    }

    @PutMapping("/{promoCodeId}")
    public ResponseEntity<PromoCodeDto> update(@PathVariable("eventId") Long eventId, @PathVariable("promoCodeId") Long promoCodeId, @RequestBody PromoCodeDto dto) {
        return ResponseEntity.ok(service.update(eventId, promoCodeId, dto));
    }

    @DeleteMapping("/{promoCodeId}")
    public ResponseEntity<Void> delete(@PathVariable("eventId") Long eventId, @PathVariable("promoCodeId") Long promoCodeId) {
        service.delete(eventId, promoCodeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/validate")
    public ResponseEntity<PromoCodeValidationResponse> validate(
            @PathVariable("eventId") Long eventId,
            @RequestParam("code") String code,
            @RequestParam(value = "ticketId", required = false) Long ticketId,
            @RequestParam(value = "orderAmount", required = false) Integer orderAmount
    ) {
        PromoCodeService.PromoCodeValidationResult result = service.validatePromoCode(code, eventId, ticketId, orderAmount);
        return ResponseEntity.ok(new PromoCodeValidationResponse(result));
    }
}

class PromoCodeValidationResponse {
    public final boolean valid;
    public final String errorMessage;
    public final Long promoCodeId;
    public final String code;
    public final String discountType;
    public final Integer discountAmount;
    public final Integer calculatedDiscount;
    public final String description;

    public PromoCodeValidationResponse(PromoCodeService.PromoCodeValidationResult result) {
        this.valid = result.isValid();
        this.errorMessage = result.getErrorMessage();
        this.promoCodeId = result.getPromoCodeId();
        this.code = result.getCode();
        this.discountType = result.getDiscountType();
        this.discountAmount = result.getDiscountAmount();
        this.calculatedDiscount = result.getCalculatedDiscount();
        this.description = result.getDescription();
    }
}
