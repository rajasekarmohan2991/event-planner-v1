package com.eventplanner.registration.payments;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/stripe")
public class StripeWebhookController {
    private final PaymentService paymentService;

    @Value("${stripe.webhook.secret:}")
    private String stripeWebhookSecret;

    public StripeWebhookController(PaymentService paymentService, ObjectMapper objectMapper) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature
    ) {
        try {
            // Verify webhook signature
            Event event = Webhook.constructEvent(payload, signature, stripeWebhookSecret);

            // Handle payment intent events
            if ("payment_intent.succeeded".equals(event.getType()) ||
                "payment_intent.payment_failed".equals(event.getType()) ||
                "payment_intent.canceled".equals(event.getType())) {

                EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
                if (deserializer != null && deserializer.getObject().isPresent()) {
                    Object obj = deserializer.getObject().get();
                    PaymentIntent paymentIntent = (PaymentIntent) obj;

                    String status = switch (event.getType()) {
                        case "payment_intent.succeeded" -> "SUCCEEDED";
                        case "payment_intent.payment_failed" -> "FAILED";
                        case "payment_intent.canceled" -> "CANCELLED";
                        default -> "PROCESSING";
                    };

                    paymentService.updatePaymentStatus(paymentIntent.getId(), status);
                }
            }

            return ResponseEntity.ok("Webhook handled");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook signature verification failed");
        }
    }
}
